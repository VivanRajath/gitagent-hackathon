---
name: code-review
description: >
  Reviews code changes for correctness, style, and security before
  applying edits. Produces a structured review report with actionable
  feedback for the requesting sub-agent.
allowed-tools: Read
---

## Role
Triggered before or after an edit is applied. Validates that the proposed
change meets quality and safety standards.

## Steps
1. Read the target file(s) via file-read tool.
2. Inspect the proposed diff for logic errors, style violations, and security issues.
3. Produce a review report with: severity, location, and suggested fix for each finding.
4. Block writes if any HIGH severity finding is present; surface to orchestrator.
5. On PASS, yield to the calling agent to proceed with the write.

## Review Criteria
- **Correctness**: No broken logic, type errors, or undefined references.
- **Security**: No hardcoded secrets, no unvalidated user input in shell commands.
- **Style**: Follows existing file conventions (indentation, naming, imports).
- **Scope**: Change is minimal and does not exceed the assigned tier's scope.

## Output
```json
{
  "result": "PASS | FAIL",
  "findings": [
    { "severity": "HIGH | MEDIUM | LOW", "file": "...", "line": 0, "message": "..." }
  ]
}
```
