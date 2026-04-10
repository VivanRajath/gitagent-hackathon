---
name: architect
description: Full-codebase architecture edit skill with read-only shell access.
allowed-tools: Read Write Bash
---

# Architect Skill

## Steps
1. Use `shell-exec` to explore: `find . -name "*.ts" | head -100`, `grep -r "pattern" src/`, etc.
2. Map full dependency graph of affected modules.
3. Propose change plan with rationale — get orchestrator acknowledgment.
4. Generate complete diff across all affected files.
5. `code-review` each file in the diff.
6. Return to `code-editor` for guardrail gate (mandatory at architect scope).
7. On ALLOW + explicit user confirmation: `file-write` all files.

## Shell Allowlist
Only these commands via shell-exec:
- `ls`, `ls -la`, `ls -R`
- `find . -name "..."` (read-only)
- `grep -r "..."` (read-only)
- `tree` or `tree -L N`
- `cat <file>`

Never: `npm install`, `npm run`, `git push`, `rm`, `mv`, `cp`.
