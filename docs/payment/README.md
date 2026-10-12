# payment

決済 (Stripe) とサブスクリプション管理を担当する Bounded Context。**upagu と共用する再利用モジュール。**

## 責務

- Stripe との連携、サブスクリプションのライフサイクル管理
- **プロダクト非依存。** `Match` / `PlayNarrator` / `Coaching` のようなこのプロダクト固有の語彙を
  持ち込まない。判断基準は「このモジュールを別リポジトリにコピーしたら動くか」
- 依存の向きは他モジュール → `payment` の一方通行。逆はイベント購読も含めて禁止

## 現状

未着手。**課金モデル（解析 1 回あたりの従量 / 定額）は未決定**（CLAUDE.md Open Decisions #6）。
解析 1 回あたりの LLM コストが高いため、課金モデルの設計は `playlog`（動画理解）と `coaching` のコスト構造が
見えてから決める。

- `requirements/` — まだ無い
- `design/` — まだ無い。変更時は `../upagu` 側への影響を必ず確認する

関連 ADR: [0005](../adr/0005-payment-as-reusable-module.md)（再利用モジュールとしての扱い）
