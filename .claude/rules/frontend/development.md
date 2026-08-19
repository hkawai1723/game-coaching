---
paths:
  - "frontend/**"
---
# Development Rules (frontend)

## 現在の構成と未導入のもの

Vite で scaffold した直後の状態。**未導入のライブラリを前提にしたコードを書かないこと。**
必要になった時点で入れて、この表を更新する。

| 領域 | 採用予定 | 状態 |
|------|----------|------|
| ビルド / 開発サーバー | Vite + React 19 + TypeScript | 導入済み |
| Lint | ESLint (flat config) + eslint-config-prettier | 導入済み |
| Format | Prettier + import 自動ソート | 導入済み |
| API クライアント生成 | **Orval**（OpenAPI → 型 + TanStack Query hooks） | **未導入**（api が OpenAPI を出せてから） |
| ルーティング | TanStack Router | **未導入** |
| サーバー状態 | TanStack Query | **未導入** |
| クライアント状態 | Zustand | **未導入** |
| HTTP クライアント | ky | **未導入** |
| Unit / Component テスト | Vitest + React Testing Library | **未導入** |
| E2E | Playwright | **未導入** |
| UI コンポーネント | shadcn/ui | **未導入** |

採用予定は `../upagu` の web と揃えてある（同じ人が両方を触るため）。変える場合は先に相談する。

### Lint / Format

| コマンド | 内容 |
|----------|------|
| `npm run lint` | ESLint |
| `npm run format` | Prettier で自動修正 |
| `npm run format:check` | 差分チェックのみ（CI 用） |

- 書式は Prettier が単独で決める。ESLint の書式系ルールは `eslint-config-prettier` で無効化済み
  （`eslint.config.js` の `extends` 末尾）。**役割を重ねない**
- import の並び順は `@ianvs/prettier-plugin-sort-imports` が自動整列する。手で並べ替えない
- **commit 時に自動で走る。** `scripts/.githooks/pre-commit` が staged の `.ts/.tsx` に対して
  `prettier --write` → `eslint --fix` → `eslint` を実行する

## API クライアント生成 (Orval)

api の OpenAPI スキーマから、型と TanStack Query hooks を生成する。導入したら以下を厳守する。

### 生成物は「コミットするが手で触らない」

- 出力先は `src/api/**`。**Git にコミットする**（CI の差分チェックが成立しなくなるため）
- **手で編集しない。** 再生成で上書きされる。ESLint / Prettier の対象からも除外済み
  （`eslint.config.js` の `globalIgnores`、`.prettierignore`）
- カバレッジの分母からも除外する

### 生成し忘れを CI で落とす

api を変更したのに Orval を回していない、を機械的に検出する。**ゲートは 2 段必要**:

```
Kotlin のコントローラ変更 ──①──> api/openapi.json ──②──> frontend/src/api/**
```

| # | ゲート | 実装 | 落ちたときの直し方 |
|---|--------|------|-------------------|
| ① | コード → スキーマ | api 側のスナップショットテスト（`/v3/api-docs` と `api/openapi.json` を比較し、差分があれば書き換えて fail） | 差分を commit に含める |
| ② | スキーマ → クライアント | `npm run api:check` = `orval && git diff --exit-code -- src/api` | `npm run api:generate` して commit |

**②だけでは不十分。** スキーマ自体をコミットして①も見ないと、「api を変えたのに」が検出できない。

pre-commit hook にも安価な整合チェックを入れてある（`api/openapi.json` だけが staged で
`frontend/src/api/` に差分が無ければ落ちる）。完全な検証は CI が行う。

### 決定性の担保（ここを外すと偽陽性で落ち続ける）

| 原因 | 対策 |
|------|------|
| springdoc の JSON キー順が不安定 | `springdoc.writer-with-order-by-keys=true` + pretty printer を有効化 |
| operationId が揺れる（hook 名が変わる） | `@Operation(operationId = "...")` で**必ず明示する**。springdoc のデフォルトはメソッド名由来で、オーバーロードすると `_1` が付く |
| orval / prettier のバージョン差 | `package.json` で**完全固定**（`^` を付けない）。CI は `npm ci` |
| Node のバージョン差 | `.nvmrc` と CI の `setup-node` を揃える |
| 改行コード | `.gitattributes` で `* text=auto eol=lf` |

## Test-Driven Development (TDD)

全ての機能追加・バグ修正で TDD を実践する:

1. テストを先に書く（RED）
2. テスト実行 → 失敗を確認
3. 最小限の実装（GREEN）
4. テスト実行 → 成功を確認
5. リファクタリング（IMPROVE）

### テスト種別

| 種別 | ツール | 対象 |
|------|--------|------|
| Unit | Vitest | ユーティリティ関数、hooks、store |
| Component | Vitest + React Testing Library | コンポーネントの振る舞い |
| E2E | Playwright | ユーザーフロー全体（動画アップロード → 解析待ち → フィードバック表示） |

### テスト方針

- ユーザーの操作・表示をベースにテストする（実装の詳細に依存しない）
- `screen.getByRole()`, `screen.getByText()` を優先。`data-testid` は最終手段
- サーバー状態のモックは MSW (Mock Service Worker) を使う
- **解析は非同期で数十秒〜数分かかる。** 進捗表示・失敗・タイムアウトの状態を必ずテストする

## コンポーネント設計

### 構成方針

- **Feature-based 構成**: 機能ごとにディレクトリを切る
- Container（データ取得・状態管理）と Presentational（表示のみ）を意識して分離する
- 再利用可能な UI は `src/components/ui/` に配置（shadcn/ui ベース）

### ディレクトリ構成

```
src/
├── components/ui/       # 汎用 UI コンポーネント（shadcn/ui）
├── features/            # 機能ごとのモジュール
│   ├── auth/            # 認証（auth-api の JWT）
│   ├── upload/          # 動画アップロード
│   ├── review/          # 解析結果（言語化されたプレイ行動）の閲覧
│   ├── coaching/        # コーチングフィードバック表示
│   ├── subscription/    # プラン・決済
│   └── <feature>/
│       ├── components/  # 機能固有コンポーネント
│       ├── hooks/       # 機能固有 hooks
│       ├── api/         # TanStack Query の query/mutation
│       └── types.ts     # 機能固有の型定義
├── lib/                 # ユーティリティ、API クライアント設定
├── stores/              # Zustand stores
└── routes/              # TanStack Router のルート定義
```

## 状態管理

- **サーバー状態**: TanStack Query で管理。直接 state に持たない
- **クライアント状態**: Zustand で最小限に管理（認証トークン、UI 状態等）
- **URL 状態**: TanStack Router の search params を活用
- **フォーム状態**: React の useState / useReducer で十分。複雑なフォームのみライブラリ検討

## 動画アップロードの扱い

- 動画は数百 MB になりうる。**アップロードの進捗表示・中断・再試行を必ず用意する**
- クライアントで受け入れる形式・サイズ上限を検証してから送る（サーバー側の検証も必須）
- アップロード完了 = 解析完了ではない。ジョブ ID を受け取り、状態をポーリングして表示する
- 解析待ちの画面はリロード・再訪しても復帰できるようにする（状態はサーバーが持つ）

## アクセシビリティ

- WAI-ARIA 準拠を意識する
- セマンティック HTML を使う（`<button>`, `<nav>`, `<main>` 等）
- キーボード操作可能にする
- フォームには適切な `<label>` を紐付ける
- 進捗・エラーは `aria-live` で読み上げられるようにする
