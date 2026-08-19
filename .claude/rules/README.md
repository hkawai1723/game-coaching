# Rules

root の `.claude/rules/` にリポジトリ全体のルールを集約する。サブディレクトリごとの `.claude/` は持たない。

## Structure

```
rules/
├── common/                 # サブプロジェクト非依存。常時ロード（paths: なし）
│   ├── agile-process.md        # スクラム、チケット運用、docs/ 構成
│   ├── git-workflow.md         # コミットメッセージ、PR ワークフロー
│   └── skill-authoring.md      # スキル作成ルール
├── api/                    # api (Kotlin / Spring Modulith) 固有。paths: api/** でスコープ
│   ├── development.md
│   ├── patterns.md
│   └── kotlin-coding-style.md
└── frontend/               # frontend (React SPA / Vite) 固有。paths: frontend/** でスコープ
    ├── development.md
    ├── patterns.md
    └── typescript-coding-style.md
```

## Rules vs Skills

- **Rules**: 常時適用される規約・制約（コーディングスタイル、セキュリティ、ワークフロー）
- **Skills** (`../skills/`): 特定タスクの深い手順書。関連すると判断された時だけロードされる

## なぜ root に集約するか

- `.claude/rules/*.md` は YAML frontmatter の `paths:` で適用対象ファイルをスコープできる。root に 1 つ置いて
  `paths: ["api/**"]` と書けば、サブディレクトリに置くのと同じ効果が得られる
- `.claude/settings.json`（hooks 含む）は起動ディレクトリからしか読み込まれない。root から 1 セッションで
  api / frontend の両方を触る運用なので、設定は root に一本化する
- 同じ内容を複数箇所で管理するとドリフトする

## インフラのルールはここに無い

このリポジトリには IaC を置いていない（`../upagu` 側で Terraform を管理）。infra を持ち込むときは
`rules/infra/` を新設し、`paths: ["infra/**"]` でスコープすること。

詳細: [Claude Code Docs - Organize rules with .claude/rules/](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/)
