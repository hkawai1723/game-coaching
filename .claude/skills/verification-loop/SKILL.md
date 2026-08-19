---
name: verification-loop
description: >-
    Runs the quality gates (build, lint, test, format, security, diff review) for whichever
    ai-game-review subprojects actually changed, and reports whether the change is ready for a PR.
    Use when the user finishes a feature, asks to verify or check the build, wants to know
    if things are ready to commit or open a PR, or after a refactor.
argument-hint: "[--all] [--staged] [--base <ref>] [--scope api,frontend] [--with-fix] [--help]"
allowed-tools: Read Grep Glob Bash(node ${CLAUDE_SKILL_DIR}/scripts/*.mjs *) Bash(git *) Bash(cd *) Bash(./gradlew *) Bash(npm *) Bash(npx *)
---

# Verification Loop

このリポジトリは `api`（Kotlin / Gradle）と `frontend`（React / npm）でゲートが全く違う。
共通コマンドは存在しないので、**変更されたサブプロジェクトのゲートだけ** を回す。

## Help

`$ARGUMENTS` に `--help` が含まれる場合、以下を表示して停止する:

```
Usage: /verification-loop [options]

Options:
  --all              変更に関係なく api/frontend の両方を検証する
  --staged           staged ファイルのみからスコープを判定する
  --base <ref>       <ref>...HEAD の差分からスコープを判定する
  --scope <list>     スコープ自動判定を上書きする (例: --scope api)
  --with-fix         フォーマッタの自動修正を実行する (デフォルト: 検査のみ)
  --help             このヘルプを表示する

Examples:
  /verification-loop                    今の変更に対応するゲートを回す
  /verification-loop --base main        main からの差分全体を検証する
  /verification-loop --all --with-fix   全部検証し、フォーマットは自動修正する
```

## Options

| Option | Default | 説明 |
|--------|---------|------|
| `--all` | OFF | 全サブプロジェクトを強制的に対象にする |
| `--staged` | OFF | staged ファイルのみからスコープ判定 |
| `--base <ref>` | auto | 比較元の ref を明示する |
| `--scope <list>` | auto | 自動判定を上書き |
| `--with-fix` | OFF | 副作用: フォーマッタで自動修正する（opt-in） |

`--with-fix` 以外はすべて読み取り専用。ファイルを書き換えない。

## Steps

### 1. スコープ判定

```bash
node ${CLAUDE_SKILL_DIR}/scripts/detect-scope.mjs
```

`--staged` / `--base <ref>` / `--all` はそのままスクリプトに渡す。
`--scope` が指定された場合はスクリプトを実行せず、指定された値をそのまま使う。

出力の `SCOPE:` 行に出たサブプロジェクトだけを対象にする。
`SCOPE: (none)` なら 3 の Common gates だけ実行する。

**このスクリプトは git リポジトリを前提にする。** 初回コミット前のリポジトリでは staged + untracked
ファイルだけで判定する（HEAD が無いため diff が取れない）。git 管理外なら `--scope` を明示すること。

### 2. サブプロジェクトごとのゲート

スコープに入ったものだけ、対応する reference を読んでから実行する。**入っていないものは読まない**（トークンの無駄）。

- api → [references/api-gates.md](references/api-gates.md)
- frontend → [references/frontend-gates.md](references/frontend-gates.md)

複数スコープがある場合は api → frontend の順。
**ビルドが落ちたそのサブプロジェクトは、そこで打ち切って次のサブプロジェクトへ進む。**
ゲートは独立しているので、1 つの失敗で全体を止めない。

### 3. Common gates（スコープ非依存・常に実行）

**Secrets scan** — 拡張子を絞らない。api は `.kt` なので TS だけ見ると素通りする。
LLM プロバイダーの API キーを特に見る。

```bash
git diff --name-only --diff-filter=ACMR HEAD | xargs -r grep -nEI 'sk-ant-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----' 2>/dev/null | head -20
```

ヒットしたら **必ず FAIL** として報告する。`.example` ファイルやテストフィクスチャの場合はその旨を添える。

**Debug 出力の残骸** — 変更されたファイルに限定して見る。

```bash
git diff --name-only --diff-filter=ACMR HEAD | grep -E '\.(ts|tsx|kt)$' | xargs -r grep -nE 'console\.log|println\(' 2>/dev/null | head -20
```

**プロンプト / 動画のログ出力** — LLM の入出力全文をログに流していないか。PII とコストの両面で問題になる。

**Diff review** — 変更ファイルを一覧し、内容を読んで確認する。

```bash
git status --short
git diff --stat HEAD
```

見るポイント:
- 意図しない変更（デバッグ用の一時変更、コメントアウトされたコード）
- エラーハンドリングの欠落
- `CLAUDE.md` のアーキテクチャ方針（DDD / モジュール境界 / SOLID / RFC 9457）からの逸脱
- **`payment` モジュールにこのプロダクト固有のドメイン語彙が漏れていないか**（upagu と共用するため）
- LLM 呼び出しがテスト・ゲートで実際に課金されない形になっているか

## Output Format

```
VERIFICATION REPORT
===================
Scope: api, frontend

api
  Build + Test  PASS
  Modularity    SKIP  (Spring Modulith 未導入)
  Lint          SKIP  (detekt 未導入)
  Format        SKIP  (spotless 未導入)

frontend
  Lint          PASS
  Build (tsc)   FAIL  3 errors
  Test          SKIP  (Vitest 未導入)
  Format        SKIP  (Prettier 未導入)

Common
  Secrets       PASS
  Debug output  1 hit
  Diff          12 files changed

Overall: NOT READY

Issues to Fix:
1. frontend/src/features/upload/api.ts:42 — Property 'jobId' does not exist
2. frontend/src/features/upload/hooks.ts:18 — console.log の残骸
```

原則:
- 実際に回したゲートだけ載せる。回していないものは `SKIP` と理由を書く
- 1 つでも FAIL があれば `Overall: NOT READY`
- Issues は `file:line` 形式で書く（クリックできる）
- **PASS を推測で書かない。** コマンドを実行して出力を確認したものだけ PASS にする

## Notes

- **ツールチェーンは発展途上。** detekt / spotless / kover / Vitest / Prettier / pre-commit hook / CI は
  まだ無い。references の「状態」列が実態。ゲートを追加したら references を先に更新する
- CI (`.github/workflows/`) を作ったら、以後はそちらがゲート定義の権威。reference と CI が食い違ったら
  CI を正として reference を直す
