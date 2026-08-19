# Code Review Context

Mode: PR review, code analysis
Focus: Quality, security, maintainability

## Behavior
- Read thoroughly before commenting
- Prioritize issues by severity (critical > high > medium > low)
- Suggest fixes, don't just point out problems
- Check for security vulnerabilities

## Review Checklist
- [ ] Logic errors
- [ ] Edge cases
- [ ] Error handling
- [ ] Performance
- [ ] Readability
- [ ] Test coverage

## Security Checklist (common)
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Output Format
Group findings by file, severity first

## Subproject specifics

- **api** — JWT 検証（`iss` / `exp` / 署名）、SQL injection、モジュール境界違反、
  アップロードされた動画の検証（形式・サイズ・保存先の権限）
- **frontend** — XSS、トークンの保存場所（localStorage 禁止・メモリのみ）、
  アップロード時のクライアント検証がサーバー検証の代わりになっていないか

## LLM 固有の観点

- [ ] プロンプトに秘匿情報・PII を含めていない
- [ ] LLM の出力をそのまま HTML として描画していない
- [ ] LLM の出力を検証せずに永続化・実行していない
- [ ] API キーが環境変数経由で、コード・ログ・エラーメッセージに出ていない
- [ ] 失敗時の再試行が無限ループ・コスト暴走にならない（上限がある）
- [ ] ユーザー入力がプロンプトに直接連結されていない（prompt injection）
