# Skill Authoring Rules

スキル (`SKILL.md`) の設計・実装ルール。

## Directory Structure

```
.claude/
├── skills/
│   ├── <skill-name>/
│   │   ├── SKILL.md              # メイン指示（薄く保つ）
│   │   ├── references/           # 差し替え可能なリファレンス群
│   │   │   ├── guide.md          # 手順・ガイド
│   │   │   ├── guide.md.example  # Git 共有用テンプレート
│   │   │   └── config.md         # 設定・パラメータ
│   │   └── scripts/              # 決定論的処理スクリプト
│   │       └── validate.mjs
│   └── references/               # スキル横断の共通リファレンス
│       └── shared-patterns.md
├── agents/                       # 再利用されるエージェント定義
│   └── <agent-name>.md
└── commands/                     # レガシー（skills/ 推奨）
```

## SKILL.md Frontmatter

必須・推奨フィールド:

```yaml
---
name: skill-name                     # ケバブケース、最大64文字、小文字+数字+ハイフンのみ
description: >-                      # 最重要。何をするか + いつ使うか。三人称で書く
    Analyzes X and generates Y.
    Use when the user asks about Z or mentions W.
disable-model-invocation: true       # 副作用ありのスキル (deploy, commit 等)
user-invocable: false                # 背景知識 (Claude のみ発火)
allowed-tools: Read Grep Bash(git *) # 必要最小限のツール許可
context: fork                        # サブエージェントで実行（独立タスク向け）
agent: Explore                       # fork 時のエージェント種別
argument-hint: <command> [options]   # 引数ヒント
---
```

### description の書き方

description はスキル発見のトリガー。起動時に常時ロードされる唯一の部分（~100トークン/スキル）。

- **三人称** で書く: `"Processes..."`, `"Extracts..."` (NOT `"I can..."`, `"You can..."`)
- **何をするか + いつ使うか** を必ず含める
- 具体的なキーワードでトリガー条件を明示する
- `description` + `when_to_use` の合計は 1,536 文字で切り詰められる

```yaml
# Good
description: >-
    Generate Flyway migration files from schema changes.
    Use when creating database migrations, adding tables, or modifying columns.

# Bad
description: Helps with database stuff
```

## Progressive Disclosure (3 層構造)

| レベル               | ロードタイミング | トークンコスト    | 内容                    |
|-------------------|----------|------------|-----------------------|
| L1: メタデータ         | 起動時に常時   | ~100/スキル   | `name`, `description` |
| L2: SKILL.md 本文   | スキル発火時   | 5,000 以下推奨 | 手順・指示                 |
| L3: references/ 等 | 参照時のみ    | 参照までゼロ     | 詳細ガイド、設定              |

### SKILL.md は薄く保つ

- **500 行以内**。超えたら references/ に分割
- Claude は既に賢い — 自明なことは書かない
- 命令形で書く。会話形式にしない
- 用語を統一する
- スキル発火後は content がセッション終了まで残る。トークンコストを意識する

### references/ ディレクトリ

差し替え可能な詳細コンテンツを配置する:

- リファレンスは **フラット構造** — リファレンスから他のリファレンスを参照しない
- SKILL.md から 1 段階の参照のみ許可
- 100 行超のリファレンスには冒頭に目次を付ける
- ファイル名は内容を表す: `form-validation-rules.md` (NOT `doc2.md`)

```markdown
# SKILL.md 内での参照例

## References

- **API 仕様**: See [references/api-spec.md](references/api-spec.md)
- **設定ガイド**: See [references/config-guide.md](references/config-guide.md)
```

## Agent の分離

複数のスキルから再利用されるエージェントは `.claude/agents/` に切り出す。

```yaml
# .claude/agents/my-agent.md
---
name: my-agent
description: Reusable specialist for X. Use PROACTIVELY when ...
tools: [ "Read", "Grep", "Glob" ]
model: sonnet
---
```

判断基準:

- 2 つ以上のスキルから同じロールが呼ばれる → agent に分離
- 1 つのスキル専用 → スキル内に指示を埋め込む
- agent はゴール指向の指示（手順ではなく目的を与える）

## Orchestration Pattern

複雑なタスクは `context: fork` でサブエージェントに委譲する:

```yaml
---
name: complex-task
description: Orchestrates multi-step analysis
context: fork
agent: general-purpose
allowed-tools: Read Grep Glob Bash(git *)
---

## Goal
Analyze $ARGUMENTS and produce a structured report.

    ## Steps
1. Explore the codebase for relevant files
2. Analyze patterns and identify issues
3. Generate a summary with file references
```

### サブエージェントの制約

- **`AskUserQuestion` は使用不可** — サブエージェントはユーザーに質問できない
- `disallowed-tools: AskUserQuestion` を明示するか、指示で「判断に迷ったらベストエフォートで進む」と記載する
- フォアグラウンド実行 (`background: false`) でないと一部ツールが使えない
- Explore / Plan エージェントは CLAUDE.md と git status をスキップする（軽量化）

### サブエージェントへの指示

ゴール指向あとからで目的を明確にする。手順の羅列ではなく達成すべき状態を伝える:

```markdown
# Good: ゴール指向

## Goal

Find all API endpoints that accept user input without validation
and report them with file paths and line numbers.

# Bad: 手順の羅列

## Steps

1. Run grep for "RequestBody"
2. Check if validation annotation exists
3. List the files
```

## --help パターン

ある程度複雑なスキルは `--help` 引数で使い方を表示する:

```yaml
---
name: my-skill
description: Does X with options
argument-hint: <target> [--help] [--verbose] [--dry-run]
---

## Help

If `$ARGUMENTS` contains `--help`, display this usage guide and stop:

```

Usage: /my-skill <target> [options]

Options:
--help Show this help message
--verbose Show detailed output
--dry-run Preview changes without applying

Examples:
/my-skill src/main Analyze src/main directory
/my-skill . --verbose Analyze current directory with details

```

## Instructions
[Actual skill logic here...]
```

## Side Effect Isolation

スキルの再利用性を上げるため、**コア機能と副作用をオプションで分離する**。

### 原則

スキルは「本質的な処理」と「付随する副作用」に分けられる。副作用はオプション引数でスキップ可能にする:

| 分類   | 例                       | デフォルト    |
|------|-------------------------|----------|
| コア機能 | diff 生成、コード解析、変換        | 常に実行     |
| 副作用  | レビュー実行、ファイル出力、通知、commit | オプションで制御 |

### オプション設計パターン

副作用は **opt-out（デフォルト実行、`--skip-*` でスキップ）** または **opt-in（`--with-*` で有効化）** で制御する。破壊的な副作用ほど
opt-in 寄りにする:

```
opt-out (デフォルトON):  --skip-review, --skip-report
opt-in  (デフォルトOFF): --with-commit, --with-push
```

### 具体例: commit スキル

```yaml
---
name: commit
description: >-
    Analyze staged changes and create a commit.
    Use when the user asks to commit.
argument-hint: [ --skip-review ] [ --skip-report ] [ --dry-run ]
---

## Options

    | Option | Default | Description |
    |--------|---------|-------------|
    | `--skip-review` | OFF (= review する) | 自動レビューをスキップ |
    | `--skip-report` | OFF (= 出力する) | レビュー結果ファイルの生成をスキップ |
    | `--dry-run` | OFF | commit せず diff とメッセージだけ表示 |

    ## Steps

    1. Analyze staged changes (コア機能 — 常に実行)
    2. Generate commit message (コア機能 — 常に実行)
3. Unless `--skip-review`: run code review (副作用)
4. Unless `--skip-report`: write review report to `<repo-root>/local/reviews/` (副作用)
5. Unless `--dry-run`: create commit (副作用)
```

### 設計判断の基準

- **他のスキルから呼ばれる可能性がある** → 副作用を分離する
- **CI / 自動化で使いたい** → 副作用を分離する
- **ファイル書き出し** → 常にスキップ可能にする（呼び出し元が出力先を決めたい場合がある）
- **外部通知（Slack, Jira 等）** → opt-in にする
- **単機能で副作用がない** → オプション不要。無理に分けない

## Team Customization Pattern

チーム内で差分を作りたい場合、`.example` パターンを使う:

```
references/
├── config.md           # ← .gitignore に入れる（個人設定）
├── config.md.example   # ← Git 追跡（テンプレート）
└── setup.sh            # ← 初回実行で .example → .md コピー
```

### .gitignore 設定

```gitignore
# Skill references (個人カスタマイズ用)
.claude/skills/*/references/*.md
!.claude/skills/*/references/*.md.example
```

### setup スクリプト

```bash
#!/bin/bash
# scripts/setup-skills.sh
# 初回実行: .example ファイルから .md を生成
find .claude/skills -name "*.md.example" | while read example; do
  target="${example%.example}"
  if [ ! -f "$target" ]; then
    cp "$example" "$target"
    echo "Created: $target"
  fi
done
```

SKILL.md の動的コンテキスト注入で初回チェックを行うことも可能:

```markdown
!
`[ -f ${CLAUDE_SKILL_DIR}/references/config.md ] || cp ${CLAUDE_SKILL_DIR}/references/config.md.example ${CLAUDE_SKILL_DIR}/references/config.md`
```

## Deterministic Processing

決定論的な処理は scripts/ のプログラムで実行する。Claude に生成させない:

- バリデーション、フォーマット変換、計算処理 → スクリプト
- スクリプトは**実行**する（コンテキストにロードしない）— 出力のみがトークンを消費
- マジックナンバー禁止 — 定数には理由をコメントする

### スクリプト言語の選択

**Node.js (`.mjs`) または Python を使う。Bash は避ける。**

理由:

- JSON パース、配列操作、正規表現 — Bash では脆弱でバグりやすい
- エラーハンドリングが構造化できる（後述）
- クロスプラットフォーム互換性が高い

```yaml
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/*.mjs *)
---

## Validation
Run `node ${CLAUDE_SKILL_DIR}/scripts/validate.mjs $ARGUMENTS` to check input.
```

Bash を使ってよいケース: `git status --short` のような単純なワンライナーのみ。

### エラーハンドリング

スクリプトのエラー出力は **Claude が次のアクションを判断できる構造** にする。raw stack trace は出さない。

出力フォーマット（stderr に出力、exit code 1）:

```
[ERROR] <何が起きたか — 1行>
  Cause: <原因の説明>
  Fix: <Claude が取るべき次のアクション>
```

Node.js の実装例:

```javascript
function fail(what, cause, fix) {
    console.error(`[ERROR] ${what}`);
    console.error(`  Cause: ${cause}`);
    console.error(`  Fix: ${fix}`);
    process.exit(1);
}

// 使用例
const filePath = process.argv[2];
if (!filePath) {
    fail(
        "No input file specified",
        "The script requires a file path as the first argument",
        "Re-run with: node validate.mjs <path-to-file>"
    );
}
```

ルール:

- `try/catch` の catch で raw error をそのまま出力しない
- `Cause` には技術的な原因（ファイルが存在しない、JSON パースエラー等）
- `Fix` には Claude が実行すべき具体的なアクション（ファイルを作成する、引数を修正する等）
- 正常終了時は stdout に結果を出力。stderr には何も出さない

## Invocation Control

| パターン      | 設定                               | 用途                     |
|-----------|----------------------------------|------------------------|
| 自動 + 手動   | デフォルト                            | 一般的なスキル                |
| 手動のみ      | `disable-model-invocation: true` | deploy, commit, send 等 |
| Claude のみ | `user-invocable: false`          | 背景知識・コンテキスト            |

副作用があるスキルは必ず `disable-model-invocation: true` を設定する。

## Dynamic Context Injection

起動前にシェルコマンドを実行し、結果をスキル内容に埋め込む:

```markdown
## Current state

!`git status --short`

## Environment

```!
node --version
npm --version
```!
```

- コマンド失敗時はスキル全体の起動が中止される
- 非ゼロ終了が想定されるコマンドには `|| true` を付ける
- パスには `${CLAUDE_SKILL_DIR}` や `${CLAUDE_PROJECT_DIR}` を使う

## Auto-Compaction Behavior

スキル発火後のコンテンツはセッション中保持されるが、auto-compaction 時:

- 最新のスキルから優先保持
- 各スキル最大 5,000 トークンまで
- 全スキル合計 25,000 トークン上限
- 古いスキルは完全に削除される可能性がある

→ 重要なスキルは compaction 後に再起動する。指示は「継続的に適用される規則」として書く。

## Naming Conventions

- **ケバブケース**: `api-design`, `tdd-workflow`
- 動名詞形推奨: `processing-pdfs`, `analyzing-data`
- ドメイン固有: `wildrift-knowledge`, `payment-stripe`
- 避ける: `helper`, `utils`, `tools`（曖昧すぎる）

## Eval-Driven Skill Development

スキルは **評価指向** で作る。SKILL.md を書く前に、まずユースケースと期待結果を定義する。

### 開発フロー

```
1. eval/cases.md を作成（ユースケース + 期待結果）
2. SKILL.md を実装
3. 別コンテキスト（サブエージェント）で各ケースを実行
4. 期待結果と実際の出力を比較
5. 不合格のケースに基づいて SKILL.md を改善
6. 3-5 を繰り返す
```

### ディレクトリ構成

```
.claude/skills/<skill-name>/
├── SKILL.md
├── eval/
│   ├── cases.md          # ユースケース定義
│   └── results/          # 実行結果（gitignore 推奨）
├── references/
└── scripts/
```

### eval/cases.md のフォーマット

```markdown
# Eval Cases: <skill-name>

## Case 1: <ケース名>

- **Input**: <スキルへの入力（引数、コンテキスト）>
- **Setup**: <前提条件（必要なファイル状態等）>
- **Expected**:
    - <期待される出力や振る舞い 1>
    - <期待される出力や振る舞い 2>
- **Must NOT**:
    - <やってはいけないこと>

## Case 2: <ケース名>

...
```

### 実行方法

各ケースは **別コンテキスト（サブエージェント）** で実行する。メインセッションのコンテキストが汚染されないようにする:

```markdown
# SKILL.md 内の eval セクション例

## Eval

Run each case in `eval/cases.md` using a forked agent:

- Execute the skill with the case's Input
- Compare output against Expected criteria
- Record pass/fail in `eval/results/`
```

ポイント:

- 1 ケース = 1 サブエージェント。コンテキストを共有しない
- 期待結果は **検証可能な条件** で書く（「いい感じ」は NG）
- ハッピーパスだけでなくエッジケース・エラーケースも含める
- eval は開発時のみ実行。本番のスキル実行には含めない

## Checklist

新しいスキルを作成する前に確認:

- [ ] description は「何をするか + いつ使うか」を含む
- [ ] description は三人称で書かれている
- [ ] SKILL.md は 500 行以内
- [ ] 詳細は references/ に分割されている
- [ ] references はフラット（他の references を参照しない）
- [ ] 決定論的処理は scripts/ に分離されている（Node.js or Python、Bash 不可）
- [ ] スクリプトのエラー出力は `[ERROR] / Cause / Fix` 構造
- [ ] eval/cases.md でユースケースと期待結果を定義済み
- [ ] 副作用は `--skip-*` / `--with-*` オプションで分離されている
- [ ] 副作用ありなら `disable-model-invocation: true`
- [ ] 再利用されるエージェントは `.claude/agents/` に分離
- [ ] サブエージェント指示はゴール指向
- [ ] 複雑なスキルは `--help` に対応
- [ ] チーム差分が必要なら `.example` パターン適用
- [ ] 用語が統一されている
