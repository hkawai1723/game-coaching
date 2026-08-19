# Performance Optimization

## Model Selection Strategy

| Model | Input $/1M | Output $/1M | Best for |
|---|---|---|---|
| Haiku 4.5 | $1.00 | $5.00 | Lightweight, frequently-invoked agents; worker agents in multi-agent systems |
| Sonnet 5 | $3.00 | $15.00 | Main development work; near-Opus quality on coding/agentic tasks at Sonnet cost |
| Opus 5 | $5.00 | $25.00 | Complex agentic coding, architectural decisions, deep reasoning — default for substantial work |
| Fable 5 | $10.00 | $50.00 | Anthropic's most capable model. Use only for the hardest long-horizon reasoning/agentic problems, or when explicitly requested — not the default upgrade path |

Pricing per Anthropic's cached rate card (2026-06); re-verify via the `claude-api` skill or `client.models.retrieve()` before quoting to stakeholders, since intro pricing windows expire.

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Extended Thinking + Plan Mode

Extended thinking is enabled by default, reserving up to 31,999 tokens for internal reasoning.

Control extended thinking via:
- **Toggle**: Option+T (macOS) / Alt+T (Windows/Linux)
- **Config**: Set `alwaysThinkingEnabled` in `~/.claude/settings.json`
- **Budget cap**: `export MAX_THINKING_TOKENS=10000`
- **Verbose mode**: Ctrl+O to see thinking output

For complex tasks requiring deep reasoning:
1. Ensure extended thinking is enabled (on by default)
2. Enable **Plan Mode** for structured approach
3. Use multiple critique rounds for thorough analysis
4. Use split role sub-agents for diverse perspectives

## Build Troubleshooting

If build fails:
1. Use **build-error-resolver** agent
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix

## Subproject specifics

- **frontend** — バンドルサイズ、動画プレイヤーの遅延ロード、アップロードのチャンク分割
- **api** — DB クエリ、非同期ジョブのスループット、**LLM 呼び出しのコストとレイテンシ**

## LLM コスト / レイテンシ

このプロダクトの支配的なコストは LLM の呼び出し。最適化の優先順位:

1. **同じ入力で二度払わない** — 動画・プロンプトの content hash でキャッシュする
   （`content-hash-cache-pattern` スキル）
2. **モデルをタスクに合わせる** — 言語化と要約は別タスク。全部を最上位モデルで回さない
   （`cost-aware-llm-pipeline` スキル）
3. **LLM に投げる前に削る** — 決定論的に取れる情報（HUD の数値等）を LLM に読ませない
   （`regex-vs-llm-structured-text` スキル）
4. **プロンプトキャッシュ** — 固定の指示・ナレッジ部分をキャッシュ対象にする

計測せずに最適化しない。入力/出力トークン数とレイテンシを構造化ログに残すのが先。
