# analysis

動画 → プレイ行動の言語化を担当する Bounded Context。プロダクトの知覚層。

## 責務

- `match` から解析依頼を受け、動画を LLM に渡してプレイ行動を構造化された行動ログにする
- LLM プロバイダーの型（SDK のリクエスト/レスポンス）をドメイン層に漏らさない
- 呼び出しは非同期・冪等・キャッシュ可能にする（コストが支配的なため）

## Port

- `PlayNarrator`（ADR-0003）— 動画から行動ログを生成する port。
  現在の実装は `analysis/infrastructure/gemini/GeminiPlayNarrator` の 1 つだけ。
  **Phase 2（自社 AI）はこの port の実装を差し替えるだけで済むように設計する。**
  知覚層（HUD・ミニマップ・KDA・ゴールド・タイマー）は決定論的でレイアウトが固定なので、
  CNN + OCR + フレーム間ヒューリスティクスに置き換えられる余地がある

## 現状

未着手。

- `requirements/` — まだ無い。行動ログのスキーマ（何を「行動」として言語化するか）が最初の論点
- `design/` — まだ無い。**Phase 1 の時点から、動画・行動ログを後から学習・評価に使える形で保存する**
  設計（利用規約・同意も込み）が必要。CLAUDE.md の Phase 2 の項を参照

関連 ADR: [0003](../adr/0003-gemini-for-play-narration.md)（Gemini 採用と Phase 2 への逃げ道）、
[0004](../adr/0004-three-tier-test-strategy.md)（`@Tag("external")` で LLM 実呼び出しをゲートから除外）
