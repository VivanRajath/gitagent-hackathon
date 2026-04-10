---
name: audit-diff
description: >
  Audits a proposed code diff for destructive operations, injection vectors,
  and scope bleed before file_write is allowed. Returns PASS or FAIL with
  categorized findings.
allowed-tools: Read
---

## Role
Invoked by the guardrail orchestrator after `code-review` passes but before
`file_write` executes. Focuses on safety and destruction — not style or
correctness (those are code-review's domain).

## Inputs
- `proposed_diff`: the full unified diff string
- `target_files`: list of files being modified
- `routed_tier`: the agent tier that generated this diff (`jnr-developer |
  snr-developer | architect`)
- `original_line_counts`: map of `{ file_path: line_count }` for scope checks

## Steps
1. Parse `proposed_diff` to extract added (`+`) and removed (`-`) lines per file.
2. Run destructive operation checks (DUTIES.md §1) against removed lines.
3. Run injection vector checks (DUTIES.md §2) against added lines.
4. Run scope bleed checks (DUTIES.md §3) against `target_files` count and `routed_tier`.
5. Aggregate findings by severity.
6. If any HIGH severity finding exists → set verdict to FAIL.
7. Return the full audit report.

## Output
```json
{
  "verdict": "PASS | FAIL",
  "agent": "diff-auditor",
  "findings": [
    {
      "severity": "HIGH | MEDIUM | LOW",
      "category": "destructive | injection | scope-bleed",
      "file": "...",
      "line": 0,
      "pattern": "...",
      "message": "..."
    }
  ]
}
```

## On FAIL
The guardrail orchestrator surfaces all HIGH findings to the user.
The calling code-editor agent must revise the diff before re-submission.
