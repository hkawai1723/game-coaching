# match

試合の受付・動画メタデータ・解析ジョブの状態管理を担当する Bounded Context。

## 責務

- プレイヤーがアップロードした動画を試合として受け付ける
- 動画のメタデータ（アップロード日時、対象タイトル、プレイヤー ID 等）を保持する
- `analysis` に解析を依頼し、ジョブの状態（受付 → 解析中 → 完了 / 失敗）を管理する
- **試合そのものの中身（誰が何をしたか）は持たない。** それは `analysis` の行動ログの責務

## Port

- `MatchSource`（ADR-0002）— 試合データの入力経路を抽象化する。現在の実装は動画アップロードのみ
  （`VideoMatchSource`）。対応タイトルは値オブジェクト `GameTitle` で表現する

## 現状

未着手。要件定義・ドメインモデリング・API 設計・データモデル設計はこれから。

- `requirements/` — まだ無い。最初のストーリーは「プレイヤーとして試合動画をアップロードできる」
  （`.claude/rules/common/agile-process.md` の Story Format 例）
- `design/` — まだ無い。解析ジョブの状態遷移は非同期処理なので、上流工程の「API 設計」段階で
  状態遷移図として定義すること（`agile-process.md` の上流工程 4 番）

関連 ADR: [0001](../adr/0001-modular-monolith-with-spring-modulith.md)（モジュール境界）、
[0002](../adr/0002-video-only-match-data-input.md)（入力経路）
