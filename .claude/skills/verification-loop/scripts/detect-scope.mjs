#!/usr/bin/env node
// 変更されたファイルパスから、検証対象のサブプロジェクト (api / frontend) を判定する。
// 判定は決定論的なのでスクリプトに寄せ、Claude には結果だけ渡す。
//
// Usage:
//   node detect-scope.mjs               # ブランチの変更 + 作業ツリーの変更から判定
//   node detect-scope.mjs --staged      # staged ファイルのみから判定
//   node detect-scope.mjs --base <ref>  # <ref>...HEAD の差分から判定
//   node detect-scope.mjs --all         # 全サブプロジェクトを対象にする

import { execFileSync } from "node:child_process";

/** パス接頭辞 → サブプロジェクト名。上から順に最初にマッチしたものを採用する。 */
const SCOPES = [
  { name: "api", prefix: "api/" },
  { name: "frontend", prefix: "frontend/" },
];

function fail(what, cause, fix) {
  console.error(`[ERROR] ${what}`);
  console.error(`  Cause: ${cause}`);
  console.error(`  Fix: ${fix}`);
  process.exit(1);
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch (e) {
    if (allowFailure) return "";
    fail(
      `git ${args.join(" ")} failed`,
      (e.stderr || e.message || "").trim() || "unknown git error",
      "Confirm the working directory is inside the ai-game-review git repository, then re-run.",
    );
  }
}

function toLines(out) {
  return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

/** コミットが 1 つも無いリポジトリでは HEAD が解決できない。diff 系を全部避ける必要がある。 */
function hasCommits() {
  return git(["rev-parse", "--verify", "--quiet", "HEAD"], { allowFailure: true }).trim() !== "";
}

/** origin/HEAD からデフォルトブランチを引く。取れなければ main にフォールバックする。 */
function defaultBranch() {
  const ref = git(["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], {
    allowFailure: true,
  }).trim();
  const name = ref.replace("refs/remotes/origin/", "");
  return name || "main";
}

function collectFiles(argv) {
  // 初回コミット前: HEAD が無いので diff は使えない。staged + untracked だけで判定する。
  if (!hasCommits()) {
    return [
      ...toLines(git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], { allowFailure: true })),
      ...toLines(git(["ls-files", "--others", "--exclude-standard"])),
    ];
  }

  if (argv.includes("--staged")) {
    return toLines(git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]));
  }

  const baseIdx = argv.indexOf("--base");
  if (baseIdx !== -1) {
    const base = argv[baseIdx + 1];
    if (!base || base.startsWith("--")) {
      fail(
        "--base was given without a ref",
        "The --base option requires a git ref as its value",
        "Re-run as: node detect-scope.mjs --base <ref>",
      );
    }
    git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`], { allowFailure: true }) ||
      fail(
        `Unknown git ref: ${base}`,
        "The ref passed to --base does not resolve to a commit",
        "Re-run with an existing ref (e.g. --base main), or omit --base to auto-detect.",
      );
    return toLines(git(["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`]));
  }

  // デフォルト: 作業ツリーの変更 + 未追跡ファイル + (ブランチが分岐していれば) ブランチ全体の差分。
  const files = new Set([
    ...toLines(git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"])),
    ...toLines(git(["ls-files", "--others", "--exclude-standard"])),
  ]);

  const base = defaultBranch();
  const current = git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  if (current !== base) {
    const mergeBase = git(["merge-base", "HEAD", base], { allowFailure: true }).trim();
    if (mergeBase) {
      for (const f of toLines(
        git(["diff", "--name-only", "--diff-filter=ACMR", `${mergeBase}...HEAD`]),
      )) {
        files.add(f);
      }
    }
  }
  return [...files];
}

const argv = process.argv.slice(2);
const forceAll = argv.includes("--all");
const files = forceAll ? [] : collectFiles(argv);

const counts = new Map(SCOPES.map((s) => [s.name, 0]));
let unscoped = 0;
for (const f of files) {
  const hit = SCOPES.find((s) => f.startsWith(s.prefix));
  if (hit) counts.set(hit.name, counts.get(hit.name) + 1);
  else unscoped += 1;
}

const active = forceAll
  ? SCOPES.map((s) => s.name)
  : SCOPES.filter((s) => counts.get(s.name) > 0).map((s) => s.name);

if (active.length === 0) {
  console.log("SCOPE: (none)");
  console.log(`  No changes under api/ or frontend/ (${unscoped} other file(s) changed).`);
  console.log("  Run only the Common gates, or re-run with --all to force every scope.");
  process.exit(0);
}

console.log(`SCOPE: ${active.join(", ")}`);
for (const name of active) {
  const n = forceAll ? "forced" : `${counts.get(name)} file(s)`;
  console.log(`  ${name.padEnd(8)} ${String(n).padEnd(14)} -> references/${name}-gates.md`);
}
for (const s of SCOPES) {
  if (!active.includes(s.name)) console.log(`  ${s.name.padEnd(8)} 0 file(s)      -> skip`);
}
if (unscoped > 0) {
  console.log(`  (${unscoped} file(s) outside api/frontend — Common gates still apply)`);
}
