# ingestion

外部から試合の入力を取り込む Bounded Context。入力は Riot API と録画の 2 本（ADR-0015）。
旧名は `match`。

## 責務

- プレイヤーの試合を Riot API（`account-v1` → `match-v5` + timeline）から取得し、生データ（JSON）のまま保管する。
  再解析で Riot API を叩き直さないため（ADR-0014）
- 試合の録画をアップロードで受け取り、Riot API の試合に紐付けて保管する（任意。録画が無い試合もある）
- 録画の再生位置とゲーム内時刻を同期し、timeline のイベントに対応するクリップを切り出す。
  決定論的な前処理で、LLM は使わない（COACH-19）
- 試合のメタデータ（取得日時、対象タイトル、Riot ID / PUUID、Riot の match ID、録画の有無）を保持する
- `playlog` に行動ログの組み立てを依頼し、ジョブの状態（受付 → 解析中 → 完了 / 失敗）を管理する
- **入力を解釈しない。** 「誰が何をしたか」を読み取るのは `playlog` の責務

## Port

- `MatchSource` — Riot API の試合を取得する経路を抽象化する。Phase 1 の実装は `RiotApiMatchSource`（ADR-0012）。
  対応タイトルは値オブジェクト `GameTitle`（`LOL` / `WILD_RIFT`）で表現する。
  Riot API の型（DTO）はこの port の裏に閉じ込める
- 録画の保存先を隠す port（例: `VideoStorage`）— 保存先は未決定（CLAUDE.md Open Decisions #4 / #10）。
  後から S3 等に差し替えられるようにする
- **録画は `MatchSource` の実装にしない。** 試合を受け付ける経路ではなく、Riot API の試合を補う入力（ADR-0015）

## 現状

未着手。要件定義・ドメインモデリング・API 設計・データモデル設計はこれから。

- `requirements/` — まだ無い。Riot アカウントの紐付け方（Riot ID 入力 / RSO）が論点
  （CLAUDE.md Open Decisions #8）。MVP は自分だけが使うので Riot ID 入力で進める（COACH-8）
- `design/` — まだ無い。解析ジョブの状態遷移は非同期処理なので、上流工程の「API 設計」段階で
  状態遷移図として定義すること（`agile-process.md` の上流工程 4 番）

関連 ADR: [0015](../adr/0015-recording-input-in-mvp-and-module-rename.md)（録画を入力に足す・改名）、
[0012](../adr/0012-lol-pc-as-first-title.md)（Riot API を入力に）、
[0014](../adr/0014-postgresql-with-exposed-and-flyway.md)（生データを JSON で保管）、
[0001](../adr/0001-modular-monolith-with-spring-modulith.md)（モジュール境界）、
[0002](../adr/0002-video-only-match-data-input.md)（旧: 動画のみ。Superseded）
