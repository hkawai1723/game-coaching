# knowledge

LoL (PC) の静的知識（チャンピオン / アイテム / ルーン / パッチ）を提供する Bounded Context。

## 責務

- Riot 公式の Data Dragon を一次情報源にする（ADR-0012）
- 取得手段（MCP / 直接取得）をこのモジュール内に閉じ込め、他モジュールには公開 API だけを見せる
- データにはパッチバージョンを必ず持たせる
- **ナレッジが引けなくてもコーチングは（精度を落として）成立させる。必須依存にしない**
- タイトルをキーに引く設計にする（`GameTitle`）。Wild Rift 用のデータは別系統（ADR-0009, Deferred）

## 現状

未着手。**MCP という形式にするか、するならどこに置くかは未決定**（CLAUDE.md Open Decisions #2）。
LoL (PC) 向けの既存 MCP サーバーも候補になる。

- `requirements/` — まだ無い
- `design/` — まだ無い。Data Dragon のデータ構造を見てからデータモデルを決める
