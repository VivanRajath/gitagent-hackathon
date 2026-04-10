---
name: run-guardrails
description: >
  Invokes the guardrail orchestrator to validate a pending action before
  execution. Returns a structured ALLOW/BLOCK verdict.
allowed-tools: Read
---

## Role
Called by the top-level orchestrator before any file_write, shell_exec, or
sub-agent dispatch that could mutate repository state.

## Inputs
The calling agent must pass:
- `action_type`: one of `file_write | shell_exec | sub_agent_dispatch`
- `payload`: the full context of the pending action
  - For `file_write`: `{ file_path, proposed_diff }`
  - For `shell_exec`: `{ command }`
  - For `sub_agent_dispatch`: `{ routed_tier, task_description, estimated_scope }`

## Steps
1. Read `RULES.md` to load the current constraint set.
2. Based on `action_type`, invoke the relevant sub-agents:
   - `file_write`          → secret-sentinel + diff-auditor + policy-enforcer
   - `shell_exec`          → policy-enforcer
   - `sub_agent_dispatch`  → scope-validator + policy-enforcer
3. Collect all verdicts. If any is BLOCK, aggregate into a single BLOCK response.
4. Return the verdict JSON to the calling orchestrator.

## Output
```json
{
  "verdict": "ALLOW | BLOCK",
  "checked_by": ["..."],
  "blocks": [
    { "agent": "...", "reason": "...", "location": "..." }
  ]
}
```

## On BLOCK
The calling orchestrator must surface the reason to the user before
taking any further action. It must NOT retry the action silently.
