# coaching

行動ログ + ナレッジ → フィードバック生成を担当する Bounded Context。プロダクトの推論層。

## 責務

- `playlog` が生成した行動ログを受け取り、「何が起きたか」から「どうすべきだったか」を説明する
- `knowledge` を参照してチャンピオン / アイテム / パッチの文脈をフィードバックに反映する
- LLM プロバイダーの型をドメイン層に漏らさない

## 現状

未着手。**フィードバック生成を Claude / Gemini どちらに投げるかは未決定**
（CLAUDE.md Open Decisions #1）。決めずにプロンプト設計を進めないこと。

- `requirements/` — [coaching-quality.md](requirements/coaching-quality.md)（Draft）。
  コーチング品質の要求整理（指摘の絞り込み、宿題の機械検証、意図の入力、結果論の禁止、
  試合横断のデータリンク構造）。「良いコーチングとは何か」の評価 rubric の観点もここにある
- `design/` — まだ無い

関連: [ADR テンプレート](../adr/template.md) — モデル選定が決まったら **必ず ADR に記録する**
（`.claude/rules/common/agile-process.md`）
