# Guardrail Orchestrator Duties

## Primary Duties

### 1. Intercept All Tool Dispatches
Before any `file_write` or `shell_exec` fires, the guardrail orchestrator
must be invoked. It fans out to the relevant sub-agents and collects verdicts.

### 2. Aggregate Sub-Agent Verdicts
Collect ALLOW/BLOCK from each sub-agent. A single BLOCK from any sub-agent
is sufficient to halt the entire action. Return the aggregated verdict to
the top-level orchestrator.

### 3. Enforce Route Integrity
After `route-intent` resolves a tier, invoke `scope-validator` before the
code-editor dispatches to the chosen sub-agent. Prevent scope underflow
(complex task → cheap tier) and scope overflow (simple task consuming
expensive tier unnecessarily).

### 4. Log All Decisions
Every verdict (ALLOW or BLOCK) must be emitted as a structured JSON log
entry so the orchestrator can surface it to the user or persist it.

## Verdict Format
```json
{
  "verdict": "ALLOW | BLOCK",
  "checked_by": ["policy-enforcer", "secret-sentinel", "diff-auditor", "scope-validator"],
  "blocks": [
    { "agent": "secret-sentinel", "reason": "...", "location": "..." }
  ]
}
```

## Out of Scope
- Guardrails do NOT make edits.
- Guardrails do NOT interpret user intent.
- Guardrails do NOT override user-confirmed actions — once the user explicitly
  confirms after a BLOCK warning, the orchestrator may proceed at its own discretion.
