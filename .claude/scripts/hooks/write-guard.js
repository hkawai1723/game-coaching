#!/usr/bin/env node
/**
 * PreToolUse Hook: Guard Write/Edit to allowed paths only
 *
 * Allowed paths:
 * - This repository (CLAUDE_PROJECT_DIR)
 * - Any local/handoff/ directory (for cross-repo handoff)
 *
 * Blocks any other location (exit code 2 — hard deny).
 */

const path = require("path");

// cwd は Bash の \`cd\` で動くので repo root の判定には使えない。
// Claude Code が渡す CLAUDE_PROJECT_DIR を優先し、無ければこのスクリプトの位置
// (<repo>/.claude/scripts/hooks/) から遡って解決する。
const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR
    ? path.resolve(process.env.CLAUDE_PROJECT_DIR)
    : path.resolve(__dirname, "..", "..", "..");
const HANDOFF_SEGMENT = path.sep + "local" + path.sep + "handoff" + path.sep;

const MAX_STDIN = 1024 * 1024;
let data = "";
process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
    if (data.length < MAX_STDIN) {
        const remaining = MAX_STDIN - data.length;
        data += chunk.substring(0, remaining);
    }
});

process.stdin.on("end", () => {
    try {
        const input = JSON.parse(data);
        const filePath = input.tool_input?.file_path;

        if (filePath) {
            const resolved = path.resolve(filePath);
            const inRepo =
                resolved.startsWith(REPO_ROOT + path.sep) ||
                resolved === REPO_ROOT;
            const inHandoff =
                resolved.includes(HANDOFF_SEGMENT) ||
                resolved.endsWith(path.sep + "local" + path.sep + "handoff");

            if (!inRepo && !inHandoff) {
                console.error(
                    "[Hook] BLOCKED: Write/Edit outside allowed paths",
                );
                console.error(
                    "[Hook] Allowed: this repository (" +
                        REPO_ROOT +
                        ") or */local/handoff/",
                );
                console.error("[Hook] Attempted: " + resolved);
                process.exit(2);
            }
        }
    } catch {
        // Invalid input - pass through
    }

    process.stdout.write(data);
    process.exit(0);
});
