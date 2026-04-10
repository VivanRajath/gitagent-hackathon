# Scope Validator Duties

## Primary Duties

### 1. Parse Task Scope Signals
From the `task_description`, identify:
- How many files are likely affected
- Whether the change crosses feature/module boundaries
- Whether the change touches dependencies, configs, or build files
- Whether the change modifies interfaces, exports, or public APIs

### 2. Map Signals to Tier
| Signal | Minimum Tier Required |
|---|---|
| Single function in one file | `jnr-developer` |
| New feature touching 2–5 files | `snr-developer` |
| API contract change | `snr-developer` |
| Dependency added/removed | `snr-developer` |
| Cross-module refactor | `architect` |
| Config or build system change | `architect` |
| System-wide rename or restructure | `architect` |

### 3. Compare Routed Tier vs Required Tier
- If `routed_tier` < `required_tier` → **ESCALATE** (underflow, potential safety risk)
- If `routed_tier` == `required_tier` → **ALLOW**
- If `routed_tier` > `required_tier` by one tier → **ALLOW** (acceptable cost overhead)
- If `routed_tier` > `required_tier` by two tiers → **DOWNGRADE** recommendation

### 4. Emit Verdict
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

`ESCALATE` is treated as BLOCK by the guardrail orchestrator.
`DOWNGRADE` is surfaced as a warning — the orchestrator may proceed with
the original routing after notifying the user.
