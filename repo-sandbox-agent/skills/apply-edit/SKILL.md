---
name: apply-edit
description: >
  Tiered agent implementation for applying targeted edits based on a user
  instruction. Delegates to jnr-developer, snr-developer, architect, or
  uiux-designer sub-agent based on intent-router tier assignment.
allowed-tools: Read Write
---

## Role Assignment
Triggered by the intent-router. The code-editor parent delegates to
the matching sub-agent:
- `jnr` tier → `jnr-developer` sub-agent
- `snr` tier → `snr-developer` sub-agent
- `architect` tier → `architect` sub-agent
- `ui` tier → `uiux-designer` sub-agent

## Steps

### For `jnr`, `snr`, `architect` tiers:
1. Review the repo-scanner structured JSON to orient with file_structure and context_summary.
2. Receive parsed instruction and target file paths.
3. Read target files via file-read tool.
4. Generate a precise, minimal patch.
5. Show a unified diff to the user.
6. Write the patch on confirmation via file-write tool.

### For `ui` tier (uiux-designer):
1. Check `canvas_triggered` flag from route-intent output.
2. If `canvas_triggered: true`:
   a. Ensure canvas-editor is running at `http://localhost:3000`
   b. Load `agents/code-editor/agents/uiux-designer/SKILL.md`
   c. Wait for canvas shape data from `GitAgentRunner`
3. If `canvas_triggered: false` (text instruction only):
   a. Parse the text instruction to infer component hierarchy
   b. Generate components directly from the description
4. Generate Next.js/Tailwind components.
5. Show component hierarchy + diff.
6. Run guardrails.
7. On ALLOW + confirmation → sync via `/api/sync`.

## Constraints & Guardrails
- **All Sub-Agents**: Never touch .env files. If ambiguous files, list candidates and ask.
- **jnr-developer**: Single-file scope only. No shell access. No architecture decisions.
- **snr-developer**: Multi-file scope within scanner's depth-3 file_structure map. No shell access.
- **architect**: Full codebase scope. Allowed to use shell-exec (read-only: ls, tree, find, grep).
- **uiux-designer**: UI files only (`src/components/`, `src/app/*.tsx`, `src/styles/`). No shell access.
  Syncs via `/api/sync` only — never writes to arbitrary paths.

## Post-Edit
Confirm success and yield execution flow back to orchestrator.
