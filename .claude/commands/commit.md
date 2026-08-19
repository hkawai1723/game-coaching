# Smart Commit

Automated commit workflow with code review gate.

## Step 1: Code Review

Run `/code-review` on all uncommitted changes.

1. Get changed files: `git diff --name-only HEAD` and `git status --short`
2. If no changes exist, stop and inform the user: "No changes to commit."
3. Perform the full code-review checks (Security/CRITICAL, Code Quality/HIGH, Best Practices/MEDIUM)

## Step 2: Review Gate

Evaluate the review results:

- **If CRITICAL or HIGH issues found**: Report all issues with file locations and descriptions. Then STOP — do NOT proceed to commit. Tell the user: "CRITICAL/HIGH issues found. Please fix them before committing."
- **If only MEDIUM/LOW or no issues**: Proceed to Step 3.

## Step 3: Draft Commit Message

1. Run `git branch --show-current` to get the current branch name
2. Run `git log --oneline -10` to see recent commit style and context
3. Run `git diff --cached --stat` and `git diff --stat` to understand the scope of changes
4. Draft a commit message in **English** following conventional commits format:
   ```
   <type>: <concise description>

   <optional body explaining why, not what>
   ```
   - Types: feat, fix, refactor, docs, test, chore, perf, ci
   - Keep the subject line under 72 characters
   - Infer the type and description from the branch name, recent commits, and actual diff

## Step 4: User Confirmation

Present the draft commit message to the user and ask:

> Here is the proposed commit:
>
> ```
> <drafted message>
> ```
>
> Files to be committed:
> - (list changed files)
>
> Shall I proceed? (OK / edit / cancel)

Wait for the user's response. Do NOT proceed until explicit approval.

## Step 5: Execute Commit

Only after receiving "OK" (or equivalent approval):

1. Stage all changes: `git add` the relevant files (prefer specific files over `git add -A`)
2. Create the commit with the approved message
3. Run `git status` to confirm success
4. Report the commit hash to the user
