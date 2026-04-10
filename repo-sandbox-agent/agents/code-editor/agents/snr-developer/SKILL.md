---
name: snr-developer
description: Multi-file feature edit skill for cross-component and integration tasks.
allowed-tools: Read Write
---

# Senior Developer Skill

## Steps
1. `file-read` all target files in feature boundary.
2. Map cross-file dependencies from repo-scanner context.
3. Output edit plan: which files, what changes, in what order.
4. Generate unified diffs for all files.
5. Run `code-review` on combined diff.
6. Return to `code-editor` for guardrail gate.
7. On ALLOW + confirmation: `file-write` all patched files.

## Constraints
- Feature boundary only (depth-3 file_structure).
- No shell. Escalate to `architect` if broader scope needed.
