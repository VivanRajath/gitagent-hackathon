---
name: jnr-developer
description: Single-file code edit skill for isolated, low-complexity patches.
allowed-tools: Read Write
---

# Junior Developer Skill

## Steps
1. `file-read` the single target file.
2. Locate the specific lines to patch.
3. Generate minimal unified diff (patch only what's needed).
4. Run internal `code-review` check.
5. Return diff to `code-editor` for guardrail gating.
6. On confirmation: `file-write` the patched content.

## Constraints
- 1 file only. Escalate if 2+ files needed.
- No shell. No new packages.
