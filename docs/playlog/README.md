# playlog

取り込んだ試合の入力から、構造化された行動ログ（`PlayLog`）を組み立てる Bounded Context。
「何が起きたか」を作る。旧名は `analysis`。

## 責務

- `ingestion` から依頼を受け、保管された Riot API のデータ（match + timeline）から行動ログを組み立てる
  （キーモーメントの抽出、時刻ごとのビルド・レベルの復元など）。**ここは決定論的に作り、LLM を使わない**
- 録画がある試合では、`ingestion` が切り出したクリップを動画理解の port に渡して言語化し、行動ログに足す
  （COACH-20〜22。ADR-0015）
  - デス前後のミクロ（位置取り、直前の行動、スキル・サモナースペルの使用状況）
  - その瞬間にプレイヤーに見えていた情報（`coaching-quality.md` FR-5 の `player_had_info`）
  - 集団戦での動き
- **事実は Riot API が正。** 動画理解には API の事実（時刻・キラー・関与者）を渡し、矛盾させない。
  動画から取ったもので事実を上書きしない
- 動画由来の情報は API 由来と区別して持つ。録画が無い試合では動画のステップを飛ばし、
  「見えていたか」は「不明」にする（「見えていた」として扱わない）

## Port

- 行動ログを作る port の名前と形は、行動ログのスキーマと一緒に決める（未設計）
- 動画理解の port — クリップ + API の事実 → 動画由来の行動。モデルの型をドメインに漏らさない。
  名前（ADR-0003 の `PlayNarrator` を流用するか、`SceneNarrator` 等にするか）、方式、モデルは
  COACH-17 で決める（CLAUDE.md Open Decisions #10）

## 現状

未着手。

- `requirements/` — [play-narration.md](requirements/play-narration.md)（Wild Rift の動画入力向けに書いたもの。
  LoL の録画で再利用できる部分は COACH-17 で見直す）。
  LoL 用の要求整理はまだ無い。行動ログのスキーマ（timeline と録画から何を「行動」として取り出すか）が最初の論点
- `design/` — [eval-set-format.md](design/eval-set-format.md)（Wild Rift 動画の評価セット形式。同上）。
  **Phase 1 の時点から、試合データ・行動ログを後から学習・評価に使える形で保存する**
  設計（Riot の利用規約・ユーザー同意も込み）が必要。CLAUDE.md の Roadmap を参照

関連 ADR: [0015](../adr/0015-recording-input-in-mvp-and-module-rename.md)（録画を入力に足す・改名）、
[0012](../adr/0012-lol-pc-as-first-title.md)（LoL を Riot API で扱う）、
[0003](../adr/0003-gemini-for-play-narration.md) / [0007](../adr/0007-perception-pipeline-with-deterministic-grounding.md)（動画の知覚層。Deferred。COACH-17 で見直す）、
[0004](../adr/0004-three-tier-test-strategy.md)（`@Tag("external")` で LLM 実呼び出しをゲートから除外）
