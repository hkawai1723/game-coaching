# Agile Process Rules

## Overview

スクラムベースのアジャイル開発。スプリント期間は 1 週間。

## Sprint Workflow

1. **Sprint Planning** — バックログからストーリーを選択、見積もり、スプリントゴール設定
2. **Development** — TDD でストーリーを実装
3. **Sprint Review** — 成果物のデモ・レビュー
4. **Retrospective** — プロセス改善

## Upstream Process (上流工程)

機能開発の前に以下を順に実施する:

1. **要求整理** — ビジネス要求の洗い出し、ユーザーストーリー作成
2. **要件定義** — 機能要件・非機能要件の明確化、MVP スコープ決定
3. **ドメインモデリング** — ユビキタス言語定義、Aggregate / Entity / VO の識別
4. **API 設計** — エンドポイント一覧、リクエスト/レスポンス定義。非同期ジョブは状態遷移も定義する
5. **データモデル設計** — テーブル設計 (ER 図)、Flyway マイグレーション計画。モジュール境界を跨ぐ FK を作らない
6. **実装計画** — タスク分解、ストーリーポイント見積もり、スプリントへの割り当て

## Jira (WBS Management)

- サイト: `https://upagu.atlassian.net`（cloudId: `ede4db40-1922-42bc-8bf9-4fbb9717b857`）
- **このプロダクトのプロジェクト: `Gaming`（プロジェクトキー `GAME`）**
- 他プロジェクト: `AUTH`（auth-api）、`CORE`（upagu）、`INTERNAL`（社内ツール）。
  **このリポジトリの作業は必ず `GAME` に切る。** upagu と共用する `payment` の変更も `GAME` 側で管理し、
  upagu への影響がある場合は `CORE` に連携チケットを作る
- 課題タイプ: エピック → ストーリー / タスク / Feature / バグ → サブタスク（日本語名。作成時は正式名で指定する）
- **ストーリーポイント** — 全 Story に必須。フィボナッチ (1, 2, 3, 5, 8, 13)
- **期日** — 全 Story / Task に必須。スプリント終了日以内
- ステータス: To Do → In Progress → In Review → Done
- Epic はプロダクト機能単位 (例: 動画解析 MVP)
- Story はユーザー価値単位 (例: 「プレイヤーとして試合動画をアップロードできる」)

## Documentation (docs/)

仕様書・設計書はリポジトリ root の `docs/` ディレクトリで Git 管理する。
Bounded Context ごとにディレクトリを分割する（サブプロジェクトごとではない）。

```
docs/
├── adr/              # リポジトリ全体の Architecture Decision Records
├── match/            # 試合の受付・動画アップロード
│   ├── requirements/
│   └── design/
├── analysis/         # 動画 → プレイ行動の言語化
│   ├── requirements/
│   └── design/
├── coaching/         # フィードバック生成
│   ├── requirements/
│   └── design/
├── knowledge/        # Wild Rift ナレッジ (MCP)
│   ├── requirements/
│   └── design/
├── user/             # ユーザープロフィール
│   ├── requirements/
│   └── design/
└── payment/          # 決済 (Stripe) — upagu と共用するモジュール
    ├── requirements/
    └── design/
```

ディレクトリ名は `api` のモジュール名と一致させる（`.claude/rules/api/patterns.md` の Module Boundaries）。
ズレたらどちらかが間違っている。

各 Bounded Context 内の構成:
- `requirements/` — 要求・要件定義
- `design/` — ドメインモデル・API 設計・データモデル

ルール:
- Markdown 形式で記述
- 設計変更時はドキュメントも同時に更新する
- リポジトリ全体に関わる技術的意思決定は `docs/adr/` に記録する
- **LLM のプロバイダー選定・プロンプト設計の変更は必ず ADR に残す。** 出力品質とコストに直結し、
  後から「なぜこの構成にしたか」が分からなくなるため

## Story Format

```
タイトル: <ユーザー種別>として、<行動>できる。それにより<価値>が得られる。

受け入れ条件:
- [ ] 条件1
- [ ] 条件2

技術メモ:
- 実装上の注意点
```
