---
name: enforce-policy
description: >
  Loads RULES.md and validates a pending action against all defined
  constraints. Returns ALLOW or BLOCK with a specific rule citation.
allowed-tools: Read
---

## Role
Invoked by the guardrail orchestrator for every tool dispatch. Acts as the
final rule-based gate before execution.

## Steps
1. Read `RULES.md` using the `Read` tool.
2. Parse the `Always`, `Never`, and `Boundaries` sections.
3. Inspect the incoming `action_type` and `payload`:
   - Check `Never` rules: does the action match any forbidden operation?
   - Check `Always` rules: are all required preconditions met?
   - Check `Boundaries`: does the calling agent tier have permission for this tool?
4. If all checks pass → return `ALLOW`.
5. If any check fails → return `BLOCK` with the exact rule text cited.

## Output
```json
{
  "verdict": "ALLOW | BLOCK",
  "agent": "policy-enforcer",
  "rule_cited": "...",
  "reason": "..."
}
```
