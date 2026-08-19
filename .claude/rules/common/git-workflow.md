# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

例:
```
feat: ログインフォームのバリデーション追加
fix: トークンリフレッシュ時の競合状態を修正
refactor: 認証 hooks を features/auth に移動
```

Note: Attribution disabled globally via ~/.claude/settings.json.

## Branch Naming

```
feature/<description>
fix/<description>
refactor/<description>
```

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. PR title should be under 70 characters
5. Include test plan with TODOs
6. Push with `-u` flag if new branch
