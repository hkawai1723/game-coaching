#!/usr/bin/env node
/**
 * PermissionRequest Hook: Auto-approve Write/Edit to allowed paths
 *
 * Auto-approved paths:
 * - .claude/ directory (within this repository)
 * - local/handoff/ directory (cross-repo handoff)
 *
 * All other paths: no decision (fall through to normal permission prompt).
 */

const path = require("path");

const REPO_ROOT = process.cwd();
const CLAUDE_DIR = path.join(REPO_ROOT, ".claude") + path.sep;
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

            const inClaudeDir =
                resolved.startsWith(CLAUDE_DIR) ||
                resolved === path.join(REPO_ROOT, ".claude");
            const inHandoff =
                resolved.includes(HANDOFF_SEGMENT) ||
                resolved.endsWith(path.sep + "local" + path.sep + "handoff");

            if (inClaudeDir || inHandoff) {
                console.error(
                    "[Hook] Auto-approving Write/Edit to: " + resolved,
                );
                const decision = JSON.stringify({
                    hookSpecificOutput: {
                        hookEventName: "PermissionRequest",
                        decision: {
                            behavior: "allow",
                        },
                    },
                });
                process.stdout.write(decision);
                process.exit(0);
            }
        }
    } catch {
        // Invalid input - pass through
    }

    // No decision — fall through to normal permission prompt
    process.exit(0);
});