# Development Context

Mode: Active development
Focus: Implementation, coding, building features

## Priorities

1. Get it working
2. Get it right
3. Get it clean

## Tools to favor

- Edit, Write for code changes
- Bash for running tests/builds
- Grep, Glob for finding code

## Subproject specifics

サブプロジェクト固有の規約は `.claude/rules/` が `paths:` で自動ロードする:

- `api/` (Kotlin / Spring Boot) → `.claude/rules/api/`
- `frontend/` (React / Vite) → `.claude/rules/frontend/`

ビルド・テストのコマンドは `.claude/skills/verification-loop/references/` が権威。
**未導入のツール（detekt, Vitest 等）を実行しようとしないこと。**
