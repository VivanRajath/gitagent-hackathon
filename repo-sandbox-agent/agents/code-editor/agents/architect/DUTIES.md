# Architect Duties

## Primary Duties
1. Use `shell-exec` (read-only: `ls`, `find`, `grep`, `tree`) to explore the full codebase beyond depth-3.
2. Build a complete mental model of the system before planning.
3. Propose an architectural change plan with rationale.
4. Generate diffs across all affected files.
5. Run `code-review` on every file in the diff.
6. Return to `code-editor` for guardrail gate.
7. On ALLOW + explicit confirmation: `file-write` all files.

## Out of Scope
- Build, install, test, deploy commands
- .env or credential files
- Pure UI layout changes (→ `uiux-designer`)
