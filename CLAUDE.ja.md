# EDH キューブ シミュレーター - Claude Code ガイドライン

Magic: The Gathering の EDH（統率者戦）キューブのカードプールを公開・閲覧するための Next.js アプリです。管理者が CubeCobra の CSV からプールを取り込み、1 つのバージョンを公開します。閲覧者は統率者・通常カード・コンボ・ゲーム外カードを固有色で絞り込んで見られます。カード名やテキストは日本語で表示します。

> repo 名に反して、現在のコードにドラフト機能はありません。

## 技術スタック

- **フレームワーク**: Next.js 15.4.10（App Router、開発時は Turbopack）
- **フロントエンド**: React 19.1.0、TypeScript、Tailwind CSS 4、lucide-react、mana-font
- **データベース**: Google Cloud Firestore（Firebase Admin SDK でサーバー側からのみアクセス）
- **非同期処理**: Google Cloud Pub/Sub → `edh-cube-discover-worker`（別 repo）
- **認証**: NextAuth v5（beta）+ Google OAuth、管理者の許可リスト
- **バリデーション**: zod 4
- **UI 開発**: Storybook 10（`@storybook/nextjs-vite`）+ Vitest のブラウザテスト
- **パッケージマネージャー**: yarn 4.6.0
- **Node バージョン**: 22.18.0（Volta で管理）

## コマンド

**必ず yarn を使ってください。**

```bash
yarn install          # 依存関係のインストール
yarn dev              # 開発サーバー（Turbopack）
yarn build            # 本番ビルド
yarn typecheck        # tsc --noEmit
yarn lint             # next lint
yarn format           # prettier --write .
yarn format:check     # prettier --check .
yarn check            # format:check + lint + typecheck
yarn storybook        # Storybook を :6006 で起動（/mcp で Storybook MCP も提供）
```

## ディレクトリ構成

```
src/
├── app/
│   ├── (user)/                     # 公開ページ（公開中のプールのみ）
│   │   ├── page.tsx                # トップ：4 つのセクションへのリンク
│   │   ├── commanders/[c]/         # 統率者カード（固有色で絞り込み）
│   │   ├── normals/[c]/            # 通常カード
│   │   ├── combos/[c]/             # プール内で成立するコンボ
│   │   ├── outside/[c]/            # ゲーム外カード（"9-" で始まるタグ）
│   │   └── cards/[id]/             # カード詳細
│   ├── admin/                      # 管理画面（middleware で保護）
│   │   ├── login/
│   │   ├── cards/[id]/             # カード詳細 + Scryfall から再取得
│   │   └── pools/                  # プール一覧・作成・削除
│   │       └── [id]/               # 編集、公開、コンボ（unlisted・翻訳）、compare/[targetId]
│   └── api/
│       ├── admin/pools/route.ts    # POST: CubeCobra CSV の取り込み
│       ├── pools/route.ts          # GET: プール一覧
│       └── auth/[...nextauth]/
├── components/
│   ├── ui/                         # 再利用 UI コンポーネント + stories
│   ├── cards/                      # CardImage, CardSearchForm, cardSearchParams
│   ├── combos/
│   ├── poolXCards/
│   └── pools/
├── domain/entity/                  # Card, Combo, Pool, PoolXCard, PoolXCombo とヘルパー
├── repository/                     # Firestore アクセス（コレクションごとに 1 ファイル）
├── lib/
│   ├── auth.ts                     # NextAuth 設定（管理者の許可リスト）
│   ├── cubecobra.ts                # CubeCobra cubeJSON クライアント + キューブ ID
│   ├── poolImport.ts               # importPool()：API 同期と CSV 取り込みで共通
│   ├── firebase/admin.ts           # Firebase Admin SDK の初期化
│   ├── pubsub.ts                   # Pub/Sub 送信ヘルパー
│   └── scryfall.ts                 # Scryfall API クライアント + スキーマ
└── middleware.ts                   # /admin/* を保護
```

`src/lib/firebase/config.ts`（クライアント SDK）、`src/lib/auth-minimal.ts`、`src/lib/auth-utils.ts` はどこからも import されていません。

## ドメインモデル（Firestore）

| コレクション               | エンティティ | 備考                                                                                                   |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| `cards/{id}`               | `Card`       | プール間で共有。`id = uuidv5(小文字化した名前)`（`newCardId`）。`scryfall`（英）と `scryfallJa` を持つ |
| `pools/{id}`               | `Pool`       | `id` は ULID。`status`: `processing` / `ready` / `error`。`published` は常に 1 つだけ                  |
| `pools/{id}/poolXCards/*`  | `PoolXCard`  | プール内のカード：`commander`、`outside`、`tags`                                                       |
| `combos/{id}`              | `Combo`      | Commander Spellbook から取得。翻訳後に `descriptionJa` / `notablePrerequisitesJa`                      |
| `pools/{id}/poolXCombos/*` | `PoolXCombo` | プール内のコンボ。`unlisted` なら公開ページに出さない                                                  |

日本語表示では `scryfallJa` を優先します（`domain/entity/card.ts` の `cardNameJa`、`cardOracle`、`cardImageUrl`）。

## プール取り込みの流れ

1. プールの作り方は 2 通りです。どちらも元データを `PoolImportRow[]` に変換し、`nextPoolVersion()` で決めた次のバージョンで `lib/poolImport.ts` の `importPool()` を呼びます。
   - **CubeCobra から同期**（推奨）：`/admin/pools` の「同期」ボタンが `syncCubeCobraAction` を呼び、`https://cubecobra.com/cube/api/cubeJSON/{CUBECOBRA_CUBE_ID}` から mainboard を読み込みます（`lib/cubecobra.ts`）。
   - **CubeCobra の CSV をアップロード**（`POST /api/admin/pools`）：`maybeboard` が `"false"` 以外の行は読み飛ばします。

   Moxfield 形式には対応していません。

2. タグ（`;` 区切り）で分類します。
   - `0-commander` → `commander: true`
   - `9-` で始まるタグがある → `outside: true`
   - `x-edh-cube-discover:fixed-name` → 名前を Scryfall の英語名に置き換える
   - `x-edh-cube-discover:exclude-combos` → コンボ検索に送らない
3. `cards` を upsert して `pool` を作成し、`after()` の中で `poolXCards` を書き込み、status を `ready` にしてから Pub/Sub にメッセージを送ります。
4. プールを公開すると（`publishPoolAction`）他のプールの公開を外し、`revalidateTag("published-pool")` を呼びます。公開ページは `published-pool` タグ付きの `unstable_cache` でキャッシュしています。

## Worker（`../edh-cube-discover-worker`）

Pub/Sub トピック `worker-topic` をトリガーに動く Google Cloud Function です。メッセージ属性 `eventType` で処理を選びます。

| eventType         | 送信元                                    | 処理内容                                                                         |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `attachScryfall`  | CSV 取り込み（Scryfall 未取得のカード）   | Scryfall から英語版・日本語版を取得 → `cards/{id}.scryfall` / `scryfallJa`       |
| `saveCombos`      | CSV 取り込み                              | Commander Spellbook で検索（3 色以下）→ `combos/*` と `pools/{id}/poolXCombos/*` |
| `translateCombos` | 管理画面のコンボページ（TranslateButton） | Vertex AI（Gemini）で翻訳 → `combos/{id}.descriptionJa` など                     |

メッセージの形と `Combo` の形は両 repo で手作業で合わせています（worker 側は zod スキーマ）。**変更するときは両方の repo を直してください。** worker は処理の完了を Firestore に書き戻しません。

## 色のルート

`[c]` セグメントは `wubrgc`、`ub`、`c`（無色）などの色の組み合わせです。`generateStaticParams` が `components/cards/cardSearchParams.ts` の `colorPathList()` から全組み合わせを生成し、`colorIn` がカードの固有色が条件に合うかを判定します。

## 環境変数

| 名前                                        | 用途                                                             |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS`            | 開発環境：サービスアカウント JSON のパス（Firestore と Pub/Sub） |
| `GCP_SERVICE_ACCOUNT_KEY_BASE64`            | 本番環境：Base64 エンコードしたサービスアカウント JSON           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`           | 開発環境での Pub/Sub のプロジェクト ID                           |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | NextAuth 用の Google OAuth                                       |
| `ADMIN_EMAILS`                              | 管理者ログインを許可するメールアドレス（カンマ区切り）           |

## 開発ガイドライン

### UI コンポーネント

**再利用する UI コンポーネントは必ず `src/components/ui/` に作り、`ui/{ComponentName}.stories.tsx` にストーリーを用意してください。**

ストーリーには props、見た目の状態やバリエーション、操作できる例を載せます。

**UI コンポーネントを実装するときは Storybook MCP を使ってください**（`.mcp.json` → `http://localhost:6006/mcp`、`yarn storybook` の起動中に使えます）。ストーリーの URL を取得して、バリエーション、レスポンシブ、操作時の状態、アクセシビリティをコンポーネント単体で確認します。

### コーディング規約

- 新しいファイルはすべて TypeScript で書く
- **関数はアロー関数で定義する** - `function ComponentName() {}` ではなく `const ComponentName = () => {}`
- **クライアントコンポーネントの命名** - `'use client'` を使うコンポーネントは `.client.tsx` 拡張子にする（例：`Button.client.tsx`）
- スタイルは Tailwind CSS で、既存のダーク / ライトモードのクラスに合わせる
- **クリックできる要素には必ず `cursor-pointer`**、無効状態には `cursor-not-allowed` を付ける
- 基本は React Server Components。データの変更は Server Actions（ページ横の `actions.ts`）で行う
- 外部入力と Firestore のデータは zod で検証する
- Firestore へのアクセスは `src/repository/`、ドメインの型とヘルパーは `src/domain/entity/` に置く
- ユーザーにわかりやすいメッセージでエラーを処理する

### 認証

- NextAuth の Google OAuth を使い、`ADMIN_EMAILS` にないメールアドレスのサインインは拒否する
- `middleware.ts` が未認証の `/admin/*` へのアクセスを `/admin/login` にリダイレクトする
- `api/admin` 配下の API ルートは自分で `auth()` を確認する

## 品質チェック

**実装を終える前に、次の順で実行してください。**

1. `yarn typecheck` - **エラー 0 で通ること（必須）**
2. `yarn lint` - **エラー 0 で通ること（必須）**
3. `yarn format:check` - Prettier の整形チェック（直すときは `yarn format`）

`yarn check` で 3 つをまとめて実行できます。

## デプロイ

- Vercel、`main` から自動デプロイ
- 環境変数は Vercel のダッシュボードで設定
- worker は自分の repo の GitHub Actions で別にデプロイ
