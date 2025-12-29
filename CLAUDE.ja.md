# EDH キューブ ドラフト シミュレーター - Claude Code ガイドライン

これはNext.jsで構築されたMagic: The Gathering EDH（Elder Dragon Highlander）キューブドラフトシミュレーターです。このアプリケーションではカードプールの管理とキューブドラフトのシミュレーションが可能です。

## プロジェクト構成

- **フレームワーク**: Next.js 15.4.10 with App Router
- **フロントエンド**: React 19.1.0、TypeScript、Tailwind CSS 4
- **データベース**: Prisma ORM with PostgreSQL
- **認証**: NextAuth with Google OAuth
- **パッケージマネージャー**: yarn 4.6.0
- **Nodeバージョン**: 22.18.0（Voltaで管理）

## 開発環境のセットアップ

### パッケージマネージャー

**このプロジェクトでは必ずyarnを使用してください。** プロジェクトはyarn 4.6.0で構成されています：

```bash
# 依存関係のインストール
yarn install

# Turbopackで開発サーバー起動
yarn dev

# プロジェクトのビルド
yarn build

# データベースマイグレーション実行
yarn prisma:push

# Prismaクライアント生成
yarn prisma:generate

# コードフォーマット
yarn format

# リントと型チェック
yarn check
```

### 環境設定

1. 環境変数でDATABASE_URLを設定
2. NextAuth用のGoogle OAuthクレデンシャルを設定
3. `yarn prisma:push`を実行してデータベーステーブルを作成

## アーキテクチャ

### ディレクトリ構成

```
src/
├── app/                    # Next.js App Router ページ
│   ├── api/               # APIルート
│   │   ├── auth/          # NextAuth設定
│   │   ├── cards/         # カード管理API
│   │   ├── drafts/        # ドラフトセッションAPI
│   │   └── pools/         # プール管理API
│   ├── admin/             # 管理画面
│   ├── drafts/            # ドラフトページ
│   ├── pools/             # プール管理ページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── ui/               # UIコンポーネントライブラリ（ここに作成）
│   ├── CardGridWithPreview.tsx
│   ├── CombosMermaidGraph.tsx
│   ├── DraftPickClient.tsx
│   ├── ExportPickedList.tsx
│   └── PickedBoard.tsx
├── lib/                  # ユーティリティライブラリ
│   ├── auth.ts           # 認証ユーティリティ
│   ├── cardImage.ts      # カード画像処理
│   ├── cardTypes.ts      # 型定義
│   └── prisma.ts         # Prismaクライアント
└── middleware.ts         # Next.jsミドルウェア
```

### 主要機能

- **プール管理**: Moxfield形式またはCubeCobra CSVからカードプールをインポート
- **ドラフトシミュレーション**: マルチプレイヤーキューブドラフトシミュレーション
- **カードデータベース**: タグとメタデータ付きでパースされたカード情報を保存
- **管理画面**: Google OAuth保護された管理機能
- **コンボ分析**: カードの組み合わせのMermaidグラフ可視化

## 開発ガイドライン

### UIコンポーネント

**再利用可能なUIコンポーネントは必ず `src/components/ui/` に作成してください。**

**各UIコンポーネントには、命名規則 `ui/{ComponentName}.stories.tsx` に従ってStorybookストーリーファイルを作成してください。**

**重要: UIコンポーネントを実装する際は、必ずStorybook MCPを活用してコンポーネントURLとプレビュー機能を開発とテストに利用してください。**

このディレクトリに作成するコンポーネントの例：

- ボタンのバリエーション
- フォームコントロール（Input、Select、Textarea）
- レイアウトコンポーネント（Card、Container）
- ローディング状態とスケルトン
- モーダルとダイアログコンポーネント
- トースト通知

#### StorybookストーリーとMCP統合

UIコンポーネントを作成する際は、必ずStorybookストーリーを含めて以下を文書化してください：

- コンポーネントのAPIとprops
- 視覚的な状態とバリエーション
- インタラクティブな例
- 使用ガイドライン

**Storybook MCPサーバーを使用して、実装中のビジュアルテストと検証のためのコンポーネントURLを取得してください：**

- コンポーネントプレビュー用のストーリーURLを生成
- 分離された環境でコンポーネントのバリエーションをテスト
- レスポンシブな動作とスタイリングを検証
- インタラクティブな状態とアクセシビリティを検証

構造例：

```
src/components/ui/
├── Button.tsx
├── Button.stories.tsx
├── Input.tsx
├── Input.stories.tsx
└── ...
```

### コード規約

- すべての新しいファイルでTypeScriptを使用
- クライアントコンポーネントには既存パターンの"use client"を使用
- スタイリングには既存のダーク/ライトモードクラスでTailwind CSSを使用
- ユーザーフレンドリーなメッセージで適切なエラーハンドリングを実装
- 適切な場所でReact Server Componentsを使用（App Routerでのデフォルト）
- **実装後は必ず `yarn lint` を実行し、エラーなしで通ることを確認する**
- 実装完了と見なす前に、すべてのリントエラーを修正する

### データベース

- データベース操作にはPrismaを使用
- スキーマ変更後は`yarn prisma:generate`を実行
- 開発環境でのデータベース更新には`yarn prisma:push`を使用
- データベースクエリにはAPIルートの既存パターンに従う

### 認証

- NextAuthによるGoogle OAuthが設定済み
- 管理ルートはミドルウェアで保護
- `src/lib/auth.ts`の認証ユーティリティを使用

### API設計

- APIルートにはREST規約に従う
- 適切なエラーハンドリングとHTTPステータスコードを含める
- リクエスト/レスポンスタイプにはTypeScriptインターフェースを使用
- 適切な場合はJSONとFormDataの両方をサポート

## テストと品質管理

**実装を完了する前に、必ず以下の品質チェックを実行してください：**

```bash
# 型チェック
yarn typecheck

# リント（エラーなしで通る必要あり）
yarn lint

# フォーマットチェック
yarn format:check

# すべてのチェックを一括実行
yarn check
```

### 品質要件

- **すべてのリントエラーを修正する必要があります** - `yarn lint` がゼロエラーで通ること
- TypeScriptエラーなしで型チェックが通ること
- Prettierスタンダードでコードフォーマットされていること
- `yarn check` ですべての品質チェックが一度に通ることを確認

## デプロイメント

アプリケーションはVercel上でのデプロイ用に設計されています：

- mainブランチからの自動デプロイ
- Vercelダッシュボードで設定された環境変数
- Vercel Postgresでホストされたデータベース

## カードデータ形式

アプリケーションは2つの入力形式をサポートしています：

### Moxfield形式

```
1 Abrade (TDC) 203 #2-targeted-disruption #9-1-R
1 Abrupt Decay (MB2) 78 #2-targeted-disruption #9-2-BG
```

### CubeCobra CSV

CubeCobraプラットフォームからの標準CSVエクスポート。

## コントリビューション

1. すべてのパッケージ操作にはyarnを使用
2. UIコンポーネントは`src/components/ui/`に作成
3. 既存のTypeScriptパターンに従う
4. 両方の入力形式で徹底的にテスト
5. ユーザーインタラクションに適切なエラーハンドリングを確保
6. Tailwind CSSでレスポンシブデザインを維持
7. **実装完了前に `yarn lint` を実行し、必ず通ることを確認する**
8. `yarn check` ですべての品質チェックが通ることを検証する
