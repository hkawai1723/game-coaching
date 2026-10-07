# docs

仕様書・設計書を **Bounded Context ごと** に置く。ディレクトリ名は `api` のモジュール名と一致させる
（`.claude/rules/api/patterns.md` の Module Boundaries）。ズレたらどちらかが間違っている。

```
docs/
├── adr/          リポジトリ全体の Architecture Decision Records
├── match/        試合の受付（Riot API から取得）・解析ジョブの状態管理
├── analysis/     試合データ → 構造化された行動ログ
├── coaching/     行動ログ + ナレッジ → フィードバック生成
├── knowledge/    LoL (PC) ナレッジ（Data Dragon）
├── user/         ユーザープロフィール
└── payment/      決済 (Stripe) — upagu と共用する再利用モジュール
```

各 Bounded Context の中は 2 つ:

| ディレクトリ | 置くもの |
|-------------|---------|
| `requirements/` | ユーザーストーリー、機能要件・非機能要件、MVP スコープ |
| `design/` | ドメインモデル（Aggregate / Entity / VO）、API 設計、データモデル |

## ルール

- Markdown で書く。設計を変えたらドキュメントも同じ PR で更新する
- **リポジトリ全体に関わる技術的意思決定は `adr/` に記録する**
- **LLM のプロバイダー選定・プロンプト設計の変更は必ず ADR を書く。** 出力品質とコストに直結し、
  後から「なぜこの構成にしたか」が分からなくなるため
- **未確定のことを確定したように書かない。** 未決定は CLAUDE.md の Open Decisions に置き、
  ドキュメント側からはそこを参照する

## 現状

Bounded Context のディレクトリは骨組みだけ。中身は各 Context の `README.md` に
「何を書く場所か」と「今どこまで決まっているか」を書いてある。実装に着手するときに埋める。
