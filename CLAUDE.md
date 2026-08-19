# CLAUDE.md — ai-game-review

## This Repository

**ai-game-review** は Wild Rift（モバイル版 LoL）のプレイ動画を解析して AI コーチングを行うプロダクト。

| ディレクトリ | 役割 | スタック |
|-------------|------|---------|
| `api/`      | ビジネスロジック + Web 向け REST。モジュラーモノリス | Kotlin 2.3 / Spring Boot 4.1 / JDK 25 / Gradle |
| `frontend/` | React SPA | Vite / React 19 / TypeScript |

`auth-api`（JWT 発行・IdentityProvider 抽象化）は他プロダクトと共有する基盤なので **別リポジトリ**
（`../upagu-auth-api`）。このリポジトリでは実装せず、発行された JWT を検証するだけ。

インフラ（IaC）はこのリポジトリに置いていない。必要になったら `../upagu` の `infra/` を参考にする。

`rules` / `skills` / `agents` / `commands` / `settings.json`（hooks 含む）は root `.claude/` に一本化している:

- `.claude/rules/common/` — リポジトリ全体に共通のルール（常時ロード）
- `.claude/rules/{api,frontend}/` — サブプロジェクト固有。`paths:` frontmatter でスコープされる
- `.claude/settings.json` — hooks は起動ディレクトリからしか読まれないため root にのみ置く

## Product Overview

プレイヤーが自分の試合動画をアップロードすると、AI がプレイを振り返ってコーチングする。

```
動画アップロード
   ↓
プレイ行動の言語化（Gemini の動画理解）      ← 「何が起きたか」を構造化された行動ログに
   ↓
コーチングフィードバック生成（Claude or Gemini） ← 「どうすべきだったか」
   ↓
フィードバック表示
```

**Wild Rift には公開 API が存在しない**（Riot の Developer API は LoL(PC) / TFT / LoR / Valorant のみ）。
そのため試合データの入力経路は動画のみ。ここが LoL(PC) との決定的な違い。

## Architecture

```
React SPA (Vite)
      |
    REST
      |
   api (Kotlin / Spring Modulith — modular monolith)
   ├── api/web    クライアント向けプレゼンテーション層（Cookie 管理、DTO 変換）
   ├── match      試合の受付・動画メタデータ・解析ジョブ
   ├── analysis   動画 → プレイ行動の言語化
   ├── coaching   行動ログ → フィードバック生成
   ├── knowledge  Wild Rift ナレッジ（チャンピオン / アイテム / パッチ）
   ├── user       ユーザープロフィール
   └── payment    決済・サブスク（upagu と共用する再利用モジュール）
      |        \         \              \
    REST        \         \              \
      |          \         \              \
  auth-api    PostgreSQL   オブジェクトストレージ   LLM API (Gemini / Claude)
  (別リポジトリ)              (動画)                      |
      |                                              MCP サーバー（Wild Rift 情報）
   Cognito
```

### Service Responsibilities

| Layer        | Responsibility |
|--------------|----------------|
| Cognito      | 認証基盤（auth-api の内部実装。このリポジトリからは見えない） |
| auth-api     | IdentityProvider 抽象化、独自 JWT 発行 (ES256)、RBAC |
| api/web      | Web 向け REST。refresh_token を HttpOnly Cookie で管理 |
| api/match    | 動画の受付、解析ジョブの状態管理 |
| api/analysis | 動画 → 行動ログ。LLM プロバイダーを port の裏に隠す |
| api/coaching | 行動ログ + ナレッジ → フィードバック |
| api/knowledge| MCP 経由で Wild Rift の静的情報を提供 |
| api/payment  | 決済 (Stripe)、サブスクリプション管理。**プロダクト非依存** |

### JWT Verification

- JWT は auth-api が発行 (ES256 / ECDSA P-256)。api は検証するだけ
- access_token 有効期限 30 分、`iss` = `upagu-auth`、`sub` = ULID (26 文字)
- refresh_token は JWT ではなく opaque token（32 バイト）。auth-api が PostgreSQL で管理する
- api は auth-api の EC 公開鍵で署名検証する。Cognito を直接知らない
- 詳細な仕様: `../upagu-auth-api/docs/auth-api-specification.md`

### MCP

Wild Rift のチャンピオン / アイテム / ルーン / パッチ情報は **自作の MCP サーバー** から取得する。
`knowledge` モジュールが MCP クライアントを内包し、他モジュールには公開 API だけを見せる。
MCP が落ちてもコーチングは（精度を落として）成立させる。必須依存にしない。

## Module Boundaries

**DDD でモジュール境界を厳格に守る。** レビューで守るのではなく Spring Modulith で機械的に落とす。

- モジュール間の直接呼び出しは禁止。公開 API（`@NamedInterface`）かドメインイベント経由のみ
- テーブルはモジュールが所有する。他モジュールのテーブルに FK を張らない。参照は ID のみ
- 循環依存禁止。`ApplicationModules.verify()` をテストで実行する
- 詳細: `.claude/rules/api/patterns.md`

### payment は再利用モジュール

`payment` は **upagu でも使う**。将来ライブラリまたは独立サービスとして切り出せる状態を保つ。

- Wild Rift / コーチングのドメイン語彙を payment 内に持ち込まない
- 依存の向きは他モジュール → `payment` の一方通行。逆はイベント購読も含めて禁止
- 判断基準は「このモジュールを別リポジトリにコピーしたら動くか」

## Repository Strategy

- ビジネスロジック（api）とフロントエンド（frontend）を 1 リポジトリに置く
- auth-api は共有基盤として別リポジトリ（`../upagu-auth-api`）
- `payment` は共有モジュール。upagu 側と実装を揃える必要があるので、変更時は影響を確認する

## Development Process

アジャイル開発。詳細は `.claude/rules/common/agile-process.md`。

- **スクラムベース** — ストーリー単位。上流工程 → 実装 → レビューのサイクル
- **チケット管理** — Jira `Gaming` プロジェクト（キー `GAME` / `https://upagu.atlassian.net`）。
  ストーリーポイントと期日を必ず設定する
- **仕様書・設計書** — `docs/<bounded-context>/` で Bounded Context ごとに管理（Git 追跡対象）
- **ADR** — `docs/adr/`。特に **LLM のプロバイダー選定・プロンプト設計の変更は必ず記録する**

## Architecture Policies

- **DDD** — Bounded Context で分割。モジュール境界を機械的に強制する
- **OOP / SOLID** — 厳格に遵守。composition over inheritance
- **TDD** — テストファースト、80%+ カバレッジを目標
- **Error Response** — RFC 9457 (Problem Details for HTTP APIs) 準拠
- **外部依存は port で反転** — LLM / ストレージ / MCP / Riot API の型をドメイン層に漏らさない
- **LLM 呼び出しは非同期・冪等・キャッシュ可能に** — コストが支配的なため
- **ドメイン層のテストは Spring を使わない** — AI 駆動で開発するため検証ループの速さが生産性を決める。
  `./gradlew unitTest` が数秒で回ることを維持する（詳細: `.claude/rules/api/development.md`）

## Quality Gates

| 対象 | コマンド | 自動実行 |
|------|----------|----------|
| api 高速テスト | `./gradlew unitTest` | — |
| api モジュール境界 | `./gradlew unitTest`（`ModularityTest` に含まれる） | — |
| api ビルド + 統合テスト | `./gradlew build` | — |
| api Lint / Format | `./gradlew detekt spotlessCheck` | **commit 時**（pre-commit hook） |
| frontend Lint / Format | `npm run lint` / `npm run format:check` | **commit 時**（pre-commit hook） |
| frontend ビルド | `npm run build` | — |

- pre-commit hook は `scripts/.githooks/pre-commit`。`api/` で `./gradlew` を一度でも実行すれば
  `installGitHooks` タスクが `core.hooksPath` を設定する（クローン後の手作業は不要）
- 未導入のツールは hook 側が自動で skip する。導入すればそのまま有効になる
- まとめて回すなら `/verification-loop` スキル

## Current State（2026-08-19 時点）

**存在しないものを前提にしたコードを書かないこと。**

| 項目 | 状態 |
|------|------|
| `api` | Spring Web (webmvc) / Actuator / Validation / **Spring Modulith 2.0.5** 導入済み。DB / Flyway は未着手 |
| モジュール境界 | `ModularityTest` が `ApplicationModules.verify()` を実行（`./gradlew unitTest` に含まれる） |
| Lint / Format | **導入済み** — api: spotless(ktlint) + detekt / frontend: Prettier + ESLint |
| pre-commit hook | **導入済み** — `scripts/.githooks/pre-commit`。`api/` で `./gradlew` を実行すると自動設定 |
| `frontend` | Vite scaffold 直後。Router / Query / 状態管理 / テストすべて未導入 |
| ツールチェーン | kover / Vitest / Playwright / Orval / CI が未整備 |
| Git | 初回コミット済み（`main`）。pre-commit hook 稼働中 |
| MCP サーバー | 未着手 |
| インフラ / DB | 未着手 |

導入したら `.claude/rules/` と `.claude/skills/verification-loop/references/` の状態表を更新すること。

## Roadmap

### Phase 1（現在）— 外部 LLM で成立させる

Gemini で言語化 → Claude/Gemini でフィードバック。まず「使えるコーチング」の基準を作る。

### Phase 2 — 自社 AI

将来的に解析を内製する。**その時に効くのは今フェーズで貯めるデータ**なので、Phase 1 の時点で:

- アップロードされた動画、生成された行動ログ、フィードバック、ユーザーの反応を
  **後から学習・評価に使える形で保存する**（利用規約・同意の設計も込みで）
- 「良いコーチングとは何か」の評価セットを作る。人手で正解を付けた試合を数十件持つ

内製の切り分けは 2 層で考える:

- **知覚層（動画 → 構造化イベント）** — HUD・ミニマップ・KDA・ゴールド・タイマーは決定論的で
  レイアウトが固定。CNN + OCR + フレーム間のヒューリスティクス（状態機械）で扱える領域であり、
  マルチモーダル LLM に丸投げするより安く・速く・再現性が高い。CNN の経験が直接効くのはここ
- **推論層（イベント → コーチング）** — 「なぜ悪手か」「代わりに何をすべきか」の説明。
  ここは LLM の領分。自前で LLM を訓練するのではなく、プロンプト + 構造化出力 + ナレッジ参照で
  精度を出し、必要なら後から蒸留する

`PlayNarrator` port（`.claude/rules/api/patterns.md`）が知覚層の差し替え境界。
Phase 2 はこの port の実装を差し替えるだけで済むように設計する。

### Phase 3 — LoL (PC) 対応

LoL は Riot API（`match-v5` 等）から構造化データが取れるため、動画解析なしでも成立する。
**同一アプリにするかは未定。** `MatchSource` port とタイトルの値オブジェクト `GameTitle` で
拡張の余地だけ残し、LoL 固有の実装は書かない（YAGNI）。

## Open Decisions（未決定）

決めずに進んでいるもの。**未決定を前提にした実装をしないこと。** 決まったらここを更新する。

1. **フィードバック生成のモデル** — Gemini で言語化した後、Claude と Gemini のどちらに投げるか
2. **MCP サーバーの置き場所** — このリポジトリ内 / 別リポジトリ
3. **LoL 対応時のアプリ構成** — 同一アプリ / 別アプリ
4. **DB・オブジェクトストレージの構成** — PostgreSQL + S3 想定だが未着手
5. **フロントの採用ライブラリ** — upagu の web に揃える前提（TanStack Router/Query, Zustand, ky, Orval）だが未導入
6. **課金モデル** — 解析 1 回あたりの LLM コストが高いので、従量 / 定額の設計が必要

## Handoff

セッション間の引き継ぎドキュメントは **リポジトリルートの `local/handoff/`** に置く（gitignore 済み）。
新しいセッションを始めるときは必ず読むこと。
