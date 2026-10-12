---
paths:
  - "api/**"
---
# Common Patterns (api)

## Module Boundaries (Spring Modulith)

モジュール構成は `api/src/main/kotlin/com/aigamereview/api/<module>/` の 1 パッケージ = 1 モジュール。

| Module      | 責務 | 他モジュールを知ってよいか |
|-------------|------|--------------------------|
| `api/web`   | クライアント向け REST。DTO 変換、Cookie 管理、認証フィルタ | 全モジュールの公開 API を呼ぶ |
| `match`     | 試合の受付。Riot API からの取得、メタデータ、解析ジョブの状態 | `analysis` のイベントを購読 |
| `analysis`  | 試合データ（timeline）→ 構造化された行動ログ。Phase 1 は LLM を使わない | なし（`match` から ID で駆動される） |
| `coaching`  | 行動ログ → フィードバック生成（Claude / Gemini）。ナレッジ参照 | `knowledge` の公開 API |
| `knowledge` | LoL (PC) のチャンピオン / アイテム / ルーン / パッチ情報（Data Dragon） | なし |
| `user`      | ユーザープロフィール | なし |
| `payment`   | 決済・サブスクリプション（Stripe） | **なし（下記参照）** |

原則:

- **モジュール間の直接呼び出しは禁止。** 公開 API（named interface）かドメインイベント経由のみ
- 公開するものは `package-info.java` / `@NamedInterface` で明示する。それ以外は internal 扱い
- 循環依存は禁止。`ApplicationModules.verify()` をテストで実行して機械的に落とす

```kotlin
@Test
fun `module boundaries are respected`() {
    ApplicationModules.of(ApiApplication::class.java).verify()
}
```

## Reusable Module (payment)

`payment` は **upagu でも使う共有モジュール**。将来ライブラリまたは独立サービスとして切り出せる状態を保つ。

- **このプロダクトのドメイン語彙を持ち込まない。** `Match` / `Coaching` / `Champion` 等を payment 内で参照しない
- **依存の向きは一方通行。** 他モジュール → `payment` のみ。`payment` から他モジュールへの依存はイベント購読も含めて禁止
- 公開するのは named interface とドメインイベント（`SubscriptionActivated` 等）だけ
- ユーザーは ID（ULID 文字列）でのみ参照する。`user` モジュールのエンティティ / テーブルに触らない
- テーブルは `payment_` プレフィックス。他モジュールのテーブルに FK を張らない
- 設定は `payment.*` プロパティ名前空間に閉じる。アプリ固有の設定を読まない
- 「このモジュールを別リポジトリにコピーしたら動くか」を判断基準にする

### Provider Abstraction (PaymentGateway)

- `PaymentGateway` interface で決済操作を定義する
- `StripePaymentGateway` が実装。将来の決済プロバイダー移行に備える
- ドメインモデルは Stripe 固有の型に依存しない

## LLM Provider Abstraction

LLM は差し替え前提。MVP のフィードバック生成は Gemini（ADR-0013）だが、後で Claude 等と比べ直す。
**モデル選択はインフラ層の実装詳細であり、ドメイン層に漏らさない。**

Phase 1（LoL (PC)）で LLM を使うのは `coaching` だけ。行動ログは Riot API のデータから
決定論的に作る（ADR-0012）。動画を言語化する `PlayNarrator` port（ADR-0003）は Deferred なので実装しない。

```kotlin
// coaching/domain — 行動ログからフィードバックを生成する port
interface CoachingAdvisor {
    fun advise(log: PlayLog, knowledge: KnowledgeSnapshot): Result<Feedback>
}
```

- 実装は `coaching/infrastructure/{claude,gemini}/...` に置く
- プロバイダー切り替えは設定（`coaching.advisor.provider`）で行う。呼び出し側は知らない
- **プロンプトはコードに埋め込まず、バージョン管理されたリソースとして持つ。** 出力の変化を追跡できるようにする
- LLM の出力はまず構造化して受け取り（JSON / tool use）、パースに失敗したら再試行 → ドメイン例外
- コスト設計は `cost-aware-llm-pipeline` スキル、パースの方針は `regex-vs-llm-structured-text` スキルを参照
- 入力（行動ログ）・プロンプトの content hash で結果をキャッシュし、再実行でコストを二重に払わない
  （`content-hash-cache-pattern` スキル）

## Match Source Abstraction

Phase 1 の対象は LoL (PC)。入力は Riot API（`match-v5` + timeline）から取る（ADR-0012）。
Wild Rift は保留中で、再開時は動画アップロードの経路を足す。**入力経路は port で抽象化しておく。**
ただし Wild Rift 用の実装は書かない（YAGNI）。

```kotlin
interface MatchSource {
    fun load(ref: MatchRef): Result<RawMatch>
}
// RiotApiMatchSource（Phase 1）/ VideoMatchSource（Wild Rift 再開時）
```

- 対応タイトルは値オブジェクト `GameTitle`（`LOL` / `WILD_RIFT`）で表現する。boolean フラグにしない
- **Riot API の型（DTO）をドメイン層に漏らさない。** `RawMatch` は自前のドメイン型
- `knowledge` はタイトルごとにデータが違う。タイトルをキーに引く設計にしておく
- Riot API のデータは全知視点（敵の位置も入っている）。「プレイヤーに見えていたか」と混同しない

## Knowledge Access

LoL (PC) のチャンピオン / アイテム / パッチ情報は Riot 公式の Data Dragon を一次情報源にする（ADR-0012）。
MCP という形式にするかは未決定（root `CLAUDE.md` Open Decisions）。

- `knowledge` モジュールが取得手段（MCP / 直接取得）を内包し、他モジュールには公開 API だけを見せる
- ナレッジが引けなくてもコーチングは（精度を落として）成立させる。ナレッジ参照は必須依存にしない
- パッチ更新でナレッジが変わるので、参照したパッチバージョンをフィードバックに記録する

## Repository Pattern

データアクセスを一貫したインターフェースの背後に隠蔽する:

- 実装は Exposed（ADR-0014）。`Table` 定義と行のマッピングは各モジュールの infrastructure 層に閉じ、
  ドメイン層に Exposed の型を出さない
- テーブル名は `<module>_` で始める（例: `match_matches`）。マイグレーションは
  `api/src/main/resources/db/migration/V<連番>__<module>_<内容>.sql`
- 標準操作を定義: findAll, findById, create, update, delete
- 具体実装がストレージの詳細（DB, API, ファイル）を扱う
- ビジネスロジックは抽象インターフェースに依存し、ストレージ機構に依存しない
- データソースの差し替えとモックによるテストを容易にする

## CQRS (Command Query Responsibility Segregation)

基本方針として CQRS を適用する。簡単な CRUD で十分な処理のみ CRUD パターンを許容する。

CQRS 適用時:
- Command（書き込み）と Query（読み取り）のモデルを分離
- Command は Domain Model 経由、Query は専用の Read Model を使用
- Query Service はアプリケーション層に配置し、ドメイン層を経由しない

## Error Response (RFC 9457)

エラーレスポンスは RFC 9457 (Problem Details for HTTP APIs) に準拠する:
- Content-Type: `application/problem+json`
- 標準メンバー: `type`, `title`, `status`, `detail`, `instance`
- 汎用エラー (400, 401, 404, 500) は `type: "about:blank"`
- アプリ固有エラーは `type: "https://<api-host>/problems/<problem-type>"`（ホストは確定後に固定する）
- 追加情報は拡張メンバーとして追加（RFC 9457 §5.2）
- Spring Boot の `ProblemDetail` クラスで実装する

## Module Event Communication

- モジュール間の直接呼び出しは禁止。`ApplicationEventPublisher` 経由でイベントを発行
- イベントは非同期で処理される。トランザクション境界に注意
- `@ApplicationModuleListener` でイベントをハンドリング
- Riot API の取得と LLM 呼び出しは時間がかかるので、`match` → `analysis` → `coaching` はイベントで繋ぐ。
  同期呼び出しでチェーンさせない
