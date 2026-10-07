# match

試合の受付・試合メタデータ・解析ジョブの状態管理を担当する Bounded Context。

## 責務

- プレイヤーの試合を Riot API（`match-v5` + timeline）から取得して受け付ける
- 試合のメタデータ（取得日時、対象タイトル、プレイヤー ID、Riot の match ID 等）を保持する
- `analysis` に解析を依頼し、ジョブの状態（受付 → 解析中 → 完了 / 失敗）を管理する
- **試合そのものの中身（誰が何をしたか）は持たない。** それは `analysis` の行動ログの責務

## Port

- `MatchSource` — 試合データの入力経路を抽象化する。Phase 1 の実装は `RiotApiMatchSource`（ADR-0012）。
  対応タイトルは値オブジェクト `GameTitle`（`LOL` / `WILD_RIFT`）で表現する。
  Wild Rift を再開するときは `VideoMatchSource` を足す（ADR-0002 は Superseded）

## 現状

未着手。要件定義・ドメインモデリング・API 設計・データモデル設計はこれから。

- `requirements/` — まだ無い。Riot アカウントの紐付け方（Riot ID 入力 / RSO）が最初の論点
  （CLAUDE.md Open Decisions）
- `design/` — まだ無い。解析ジョブの状態遷移は非同期処理なので、上流工程の「API 設計」段階で
  状態遷移図として定義すること（`agile-process.md` の上流工程 4 番）

関連 ADR: [0001](../adr/0001-modular-monolith-with-spring-modulith.md)（モジュール境界）、
[0012](../adr/0012-lol-pc-as-first-title.md)（入力経路を Riot API に）、
[0002](../adr/0002-video-only-match-data-input.md)（旧: 動画のみ。Superseded）
