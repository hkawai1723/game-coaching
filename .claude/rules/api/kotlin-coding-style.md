---
paths:
  - "api/**/*.kt"
  - "api/**/*.kts"
---
# Kotlin Coding Style (api)

> このファイルは [../common/](../common/) のルールを Kotlin / Spring Boot 向けに拡張する。

## Tooling

| 用途 | ツール | コマンド | 状態 |
|------|--------|----------|------|
| Formatter | spotless + ktlint 1.5.0 | `./gradlew spotlessApply` | 導入済み |
| Linter | detekt | `./gradlew detekt` | 導入済み |
| Coverage | kover 0.9.1 | `./gradlew koverVerify` | 導入済み。現状は `minBound(0)`（コードが無いためラチェットの床がまだ 0） |

- 書式のルールは `.editorconfig`（リポジトリルート / indent=4, max_line_length=140, intellij_idea style）が正。
  ktlint がこれを読む
- detekt の上書き設定は `api/config/detekt/detekt.yml`。`buildUponDefaultConfig = true` なので
  ここに書いたものだけがデフォルトを上書きする
- **役割は重ねない。** 書式は ktlint、コード品質は detekt。detekt の formatting 系ルールは使わない
- `autoCorrect = false`。detekt の指摘は手で直す（spotless だけが自動修正する）
- **commit 時に自動で走る。** `scripts/.githooks/pre-commit` が staged の `.kt` に対して
  `spotlessApply` → `spotlessCheck` + `detekt` を実行する

## Kotlin Idioms

- `data class` を積極的に使う（Value Object, DTO）
- `sealed class` / `sealed interface` で代数的データ型を表現
- `when` は網羅的に使う（`else` を安易に使わない）
- Null safety を活用。`!!` は原則禁止。`?.let`, `?:`, `requireNotNull` を使う
- Extension functions は utility 的な用途に限定。ドメインロジックには使わない
- `var` より `val`。ミュータブルな状態は最小限に

## Error Handling

- ドメイン例外は sealed class で定義
- Spring の `@RestControllerAdvice` で一元ハンドリング。ProblemDetail (RFC 9457) でレスポンスを返す
- `runCatching` は外部 API 呼び出し等の境界でのみ使用。内部ロジックでは使わない
- LLM / MCP の呼び出し結果は `Result` で受け、失敗理由をドメインの言葉に翻訳してから上げる
  （SDK の例外型をアプリケーション層より上に漏らさない）

## Dependency Injection

- Constructor injection のみ使用（`@Autowired` field injection 禁止）
- Interface に依存し、実装クラスに直接依存しない
- LLM プロバイダーのように実装が複数ある port は `@ConditionalOnProperty` か Factory で選択する。
  呼び出し側が実装名を知ってはいけない

## Coroutines / 非同期

- 動画解析・LLM 呼び出しはブロッキングしない。`suspend` 関数として定義する
- リクエストスレッドで長時間処理を待たない。ジョブとして受け付けて状態をポーリング / 通知で返す
- `GlobalScope` 禁止。スコープはコンポーネントのライフサイクルに紐付ける

## ログ

- 動画やプロンプト全文をログに出さない（PII とトークンコストの両面で問題になる）
- LLM 呼び出しは「モデル名・入力トークン数・出力トークン数・レイテンシ・content hash」を構造化ログで残す
- `println` 禁止。SLF4J を使う
