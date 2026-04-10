---
name: validate-scope
description: >
  Validates that the tier selected by route-intent matches the actual
  complexity of the task. Returns ALLOW, ESCALATE, or DOWNGRADE.
allowed-tools: Read
---

## Role
Invoked by the guardrail orchestrator after route-intent resolves a tier
and before code-editor dispatches to a sub-agent.

## Inputs
- `routed_tier`: the tier chosen by route-intent (`jnr-developer | snr-developer | architect`)
- `task_description`: the original natural language task from the user
- `estimated_scope`: optional scope hint from route-intent (file count, module count)

## Steps
1. Parse `task_description` for scope signals (DUTIES.md §1).
2. Map signals to the minimum required tier (DUTIES.md §2).
3. Compare `routed_tier` against `required_tier` (DUTIES.md §3).
4. If scan context is available in `memory/MEMORY.md`, read it to improve
   scope estimation (e.g. knowing the repo has 200 files changes what
   "multi-file" means).
5. Return the verdict with reasoning.

## Output
```json
{
  "verdict": "ALLOW | ESCALATE | DOWNGRADE",
  "agent": "scope-validator",
  "routed_tier": "...",
  "recommended_tier": "...",
  "reason": "...",
  "scope_signals": ["..."]
}
```

## On ESCALATE
The guardrail orchestrator re-routes to the recommended tier and notifies
the user that the original routing was insufficient.

## On DOWNGRADE
The guardrail orchestrator surfaces a cost-saving suggestion to the user
but does not block execution.
