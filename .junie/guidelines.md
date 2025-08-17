# 開発ガイドライン（junie 用）

このリポジトリで junie（およびコントリビューター）が開発を行う際のルールとベストプラクティスをまとめます。

## 1. パッケージマネージャーとランタイム

- 必ず Volta 管理下の Yarn（Yarn 4）を使用してください。
  - package.json には Volta 設定が含まれています。
  - Node/Yarn のバージョンは Volta により固定されています（package.json の volta フィールド参照）。
- npm/pnpm は使用しないでください。特に次の点を厳守:
  - `npm install` を実行しない。
  - `package-lock.json` は使用しません。存在する場合は削除して構いません（`yarn.lock` を唯一のロックファイルとします）。

### 基本コマンド（Yarn 4）

- 依存関係のインストール: `yarn install`
- 依存関係の追加（prod）: `yarn add <pkg>`
- 依存関係の追加（dev）: `yarn add -D <pkg>`
- 依存関係の削除: `yarn remove <pkg>`
- スクリプト実行: `yarn <script>` 例) `yarn dev`, `yarn build`

## 2. 実装完了時のチェック（必須）

実装が完了したら、以下のチェックを必ず実行し、エラーや警告があれば修正してください。

- フォーマットチェック: `yarn format:check`
- Lint: `yarn lint`
- 型チェック: `yarn typecheck`
- まとめて実行する場合は: `yarn check`

必要に応じて:

- 自動整形: `yarn format`

## 3. プロジェクト固有のコマンド

- 開発サーバー: `yarn dev`
- ビルド: `yarn build`（Prisma の generate を含む）
- 本番起動: `yarn start`
- Prisma 関連:
  - クライアント生成: `yarn prisma:generate`
  - スキーマ反映（開発向け）: `yarn prisma:push`

Prisma スキーマ変更時は `yarn prisma:generate` を忘れずに実行してください。

## 4. コードスタイルと Lint 方針

- コードスタイルは Prettier に準拠します。
- Lint は ESLint（Next.js 設定）に準拠します。
- import 順序・未使用変数・型の暗黙 any などの警告/エラーが出た場合は修正してください。

## 5. TypeScript 方針

- `strict` な型付けを基本とし、`any` は必要最小限に留め、理由をコメントで明記してください。
- API の入出力や外部からの入力値は、可能ならスキーマバリデーション（例: zod）を用いて検証してください。（導入が必要になった時点で相談）

## 6. Next.js/アプリ設計の一般ルール

- サーバーコードとクライアントコードの境界を明確に（`"use client"` の付与やサーバーアクション/ルートハンドラの責務分離）。
- API ルートでは例外を握りつぶさず、適切なステータスコードと JSON メッセージを返却。
- 非同期処理はエラーハンドリングを徹底（try/catch もしくは `.catch`）。
- アクセシビリティ（a11y）を意識し、基本的な属性（aria-\*、代替テキスト等）を付与。
- パフォーマンス:
  - 不要な再レンダリングを避ける（メモ化、依存関係の最小化）。
  - 画像/アセットは必要に応じて最適化。

## 7. Git 運用

- ブランチ命名例: `feat/<summary>`, `fix/<summary>`, `chore/<summary>`
- コミットメッセージは短く要点をまとめ、必要ならボディに詳細を書く（日本語で OK）。
- lockfile は `yarn.lock` のみをコミット対象にしてください（`package-lock.json` はコミットしない）。

## 8. 環境変数

- `.env*` は秘匿情報を含むためコミットしない（既存の .gitignore 設定を尊重）。
- ローカル開発では `.env.development.local` を使用し、必要なキーを README やコメントで明示（値は秘匿）。

## 9. CI/自動化（任意）

- CI では `yarn install --immutable` を使用し、`yarn check` を実行してください。
- pre-commit で `yarn format:check` / `yarn lint` / `yarn typecheck` を走らせることを推奨（必要に応じて husky/lefthook などを導入）。

## 10. トラブルシュート

- Yarn 4 でスクリプトから別スクリプトを呼ぶ場合は、直接コマンドを並べるか `yarn run -T <script>` を使用します（本プロジェクトのスクリプトは直接コマンドを連結しています）。
- Volta が効いていない場合: `volta install node@22.18.0 yarn@4.6.0` を実行した後に再度お試しください。

---

このガイドラインに従って開発を進めてください。疑問点や例外が必要な場合は issue/PR で相談してください。
