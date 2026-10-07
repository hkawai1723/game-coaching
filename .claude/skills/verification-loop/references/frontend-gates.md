# frontend Gates (React SPA / Vite)

`frontend/` に変更があるときだけ読む。すべて `frontend/` ディレクトリで実行する。

## Gates

| # | Gate | Command | 状態 | 失敗時 |
|---|------|---------|------|--------|
| 1 | Lint | `npm run lint` | 利用可 | 報告して修正 |
| 2 | Type check + Build | `npm run build` | 利用可 | STOP。以降のゲートを回さず修正する |
| 3 | Format | `npm run format:check` | 利用可 | 報告。`--with-fix` 時のみ `npm run format` |
| 4 | API クライアント drift | `npm run api:check` | Orval 導入後 | **FAIL 扱い**。`npm run api:generate` して commit |
| 5 | Unit test + Coverage | `npm run test:coverage` | 利用可 | 報告して修正。閾値は `vitest.config.ts` の `coverage.thresholds` |

```bash
cd frontend
npm run lint
npm run build
npm run format:check
npm run test:coverage
```

## 注意点

- **`package.json` に無いスクリプトを叩かない。** 現在あるのは `dev` / `build` / `lint` / `format` /
  `format:check` / `preview` / `test:run` / `test:coverage` / `e2e`。`test` / `api:check` は存在しない。
  レポートには `SKIP (未導入)` と書く
- **Orval 生成物 (`src/api/**`) の差分を「無関係な変更」として無視しない。** 差分が出ている＝
  生成し直していないか、api 側のスキーマが変わったということ。必ず報告する
- **`npm run build` は `tsc -b && vite build`。** 型チェックがビルドに内包されているので、別途
  `npx tsc --noEmit` を回す必要はない。二重実行になる
- **`npm run dev` を検証で使わない。** サーバーが起動したまま戻ってこない。ビルドの確認は `build`
- `npm run test` ではなく `test:run`（= `vitest run`）を使う。watch モードに入って戻ってこないので、
  `test` スクリプトはあえて定義していない
- `node_modules` が無ければ先に `npm ci`。`npm install` ではなく `npm ci`（CI と同じ解決にするため）
- E2E (Playwright, `npm run e2e`) はこのスキルの対象外。ブラウザ起動を伴い桁違いに遅いので、明示的に頼まれたときだけ回す

## ツール導入時にやること

Vitest / Prettier を入れたら:

1. この表の「状態」と、下の `--with-fix` セクションを更新する
2. `.claude/rules/frontend/development.md` の構成表を更新する
3. カバレッジ閾値は `vitest.config.ts` の `coverage.thresholds` に置く。**現状値を床にしたラチェット**で
   運用し、テストを増やすたびに床を上げる

## pre-commit hook

`scripts/.githooks/pre-commit` が staged の `.ts/.tsx` に対して `prettier --write` → `eslint --fix`
→ `eslint`（チェック）を実行する。**hook が効いているなら Lint / Format ゲートは通って当然。**
落ちたら hook 未設定を疑う（`git config core.hooksPath`）。

## --with-fix 時のみ

```bash
cd frontend
npm run format
npx eslint . --fix
```
