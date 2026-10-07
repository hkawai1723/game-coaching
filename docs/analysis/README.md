# analysis

試合データ → 構造化された行動ログを担当する Bounded Context。プロダクトの知覚層。

## 責務

- `match` から解析依頼を受け、Riot API の試合データ（timeline）から行動ログを組み立てる
  （キーモーメントの抽出、時刻ごとのビルド・レベルの復元など）
- **Phase 1 は LLM を使わない。** 行動ログは API データから決定論的に作る（ADR-0012）
- API のデータは全知視点。「プレイヤーに見えていたか」は別に扱う必要がある（ADR-0012 の Consequences）

## Port

- 行動ログを作る port の名前と形は、行動ログのスキーマと一緒に決める（未設計）
- `PlayNarrator`（ADR-0003, Deferred）— 動画から行動ログを生成する port。Phase 1 では実装しない。
  動画を入力にする時点（Wild Rift 再開、または LoL で動画を足す時）に見直す

## 現状

未着手。

- `requirements/` — [play-narration.md](requirements/play-narration.md)（Deferred。Wild Rift / 動画入力向け）。
  LoL 用の要求整理はまだ無い。行動ログのスキーマ（timeline から何を「行動」として取り出すか）が最初の論点
- `design/` — [eval-set-format.md](design/eval-set-format.md)（Deferred。Wild Rift 動画の評価セット形式）。
  **Phase 1 の時点から、試合データ・行動ログを後から学習・評価に使える形で保存する**
  設計（Riot の利用規約・ユーザー同意も込み）が必要。CLAUDE.md の Phase 2 の項を参照

関連 ADR: [0012](../adr/0012-lol-pc-as-first-title.md)（LoL を Riot API で扱う）、
[0003](../adr/0003-gemini-for-play-narration.md) / [0007](../adr/0007-perception-pipeline-with-deterministic-grounding.md)（動画の知覚層。Deferred）、
[0004](../adr/0004-three-tier-test-strategy.md)（`@Tag("external")` で LLM 実呼び出しをゲートから除外）
