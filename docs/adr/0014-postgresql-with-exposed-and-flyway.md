# ADR-0014: 永続化は PostgreSQL + Exposed + Flyway にし、テーブルはモジュール名を頭に付けて所有する

- **Status**: Accepted
- **Date**: 2026-10-12
- **Deciders**: h.kawai

## Context

MVP（COACH-5）では、試合の生データ・行動ログ・フィードバックを、後から評価や再解析に使えるように保存する。
CLAUDE.md Open Decisions #4（DB の構成）を決め、DB アクセスの方式も選ぶ必要がある（COACH-7）。

**事実:**

- 試合の生データ（match-v5 + timeline）は加工せずに JSON のまま持つ（COACH-9）。
  1 試合の timeline は数百 KB になる
- Spring Modulith の Event Publication Registry（COACH-12 で使う予定）には JDBC 実装がある
- `payment` は upagu と共用するモジュール（ADR-0005）。upagu（`core`）と auth-api は
  **Exposed 1.3.1 + Flyway + PostgreSQL** で、`ExposedConfig` が Spring Boot の DataSource に
  `Database.connect` している
- upagu と auth-api のテストは H2 を使っている

## Decision

### 1. DB は PostgreSQL（compose では `postgres:18-alpine`）

- ローカルは compose の `postgres` サービス。データは named volume `postgres-data` に残す
- api は postgres の healthcheck が通ってから起動する
- 接続情報は環境変数（`DB_URL` / `DB_USERNAME` / `DB_PASSWORD`）。サンプルは `.env.example`

### 2. DB アクセスは Exposed（JPA / Spring Data JDBC は採らない）

- upagu / auth-api と同じ Exposed 1.3.1 を使う。`payment` を「別リポジトリにコピーしたら動く」状態に保つには、
  永続化の書き方も揃っている必要がある
- Exposed は Spring Boot の DataSource（HikariCP）に繋ぐ（`ExposedConfig`）。接続を二重に持たない
- Exposed の `Table` 定義と行のマッピングは各モジュールの infrastructure 層に閉じる。
  ドメイン層は Exposed の型を知らない（Repository port の裏に置く）

### 3. スキーマは Flyway で管理し、テーブルはモジュールが所有する

- マイグレーションは `api/src/main/resources/db/migration/`。ファイル名は `V<連番>__<module>_<内容>.sql`
- **テーブル名は `<module>_` で始める**（例: `match_matches`、`analysis_play_logs`）。
  patterns.md の `payment_` と同じ規則を全モジュールに広げる
- PostgreSQL のスキーマをモジュールごとに分ける方式は採らない。1 スキーマ + 名前の頭で十分に区別でき、
  upagu の `payment_` とも揃う
- 他モジュールのテーブルに FK を張らない。参照は ID だけ（CLAUDE.md Module Boundaries）

### 4. 統合テストは Testcontainers の PostgreSQL で回す

- `@Tag("integration")` のテストは `TestcontainersConfiguration`（`@ServiceConnection`）を `@Import` する
- H2 は使わない。JSONB など PostgreSQL 固有の機能を使うため
- `./gradlew unitTest` は今までどおり DB も Docker も使わない

## Consequences

### 良くなること

- `payment` のコードを upagu とそのまま行き来させられる
- JSON の生データを JSONB で持てる。行動ログの作り直しや評価用の抽出を SQL で書ける
- 統合テストと本番（compose）が同じ DB エンジンになる

### 悪くなること / 引き受けるリスク

- **`./gradlew test` / `build` に Docker が必要になる。** Docker が動いていないと統合テストが落ちる
- Exposed のトランザクションは、そのままだと Spring の `@Transactional` とは別に管理される。
  Event Publication Registry（JDBC）と同じトランザクションでドメインの変更を書きたくなった時点（COACH-12）で、
  Exposed の Spring 連携（`SpringTransactionManager`）に寄せるかを決める
- upagu はテストに H2 を使っているので、テスト基盤は揃っていない

### この決定を覆すときのコスト

中程度。Exposed は各モジュールの Repository 実装の中に閉じているので、差し替えは infrastructure 層だけで済む。
テーブルの命名規則とマイグレーションは DB アクセスの方式とは関係なく残る。

## Alternatives Considered

| 案 | 却下理由 |
|----|---------|
| Spring Data JPA | upagu と書き方がずれ、`payment` を共用しにくくなる。遅延ロードやダーティチェックは、ID だけで参照し合う集約の設計には要らない |
| Spring Data JDBC | 集約単位の設計には合うが、upagu とずれる点は JPA と同じ |
| モジュールごとに PostgreSQL のスキーマを分ける | 境界はより強く守れるが、Flyway の管理とテスト設定が増える。名前の頭と Spring Modulith の検証で足りる |
| テストに H2 を使う（upagu と揃える） | JSONB を再現できない。生データの保存（COACH-9）ですぐ困る |
