# Diff Auditor Duties

## Primary Duties

### 1. Destructive Operation Detection
Flag diffs that contain:
- Deletion of more than 30% of the original file's lines
- Removal of `auth`, `authenticate`, `authorize`, `verify`, `validate` function calls
- Overwrite of lock files (`package-lock.json`, `yarn.lock`, `go.sum`)
- Removal of error handling blocks (`catch`, `except`, `rescue`, `defer`)
- Truncation of config files to empty or near-empty state

### 2. Injection Vector Detection
Scan all added lines (`+` prefix) for:
- **Shell injection**: backtick execution, `$()`, unsanitized vars in shell strings
- **Code injection**: `eval(`, `new Function(`, `exec(`, `os.system(`, `subprocess.call(`
  with non-literal arguments
- **SQL injection**: string concatenation into SQL queries without parameterization
- **XSS**: `innerHTML =`, `document.write(` with non-sanitized values
- **Prototype pollution**: `__proto__`, `constructor.prototype` assignment patterns

### 3. Scope Bleed Detection
Verify that:
- A `jnr-developer` diff touches only 1 file
- A `snr-developer` diff touches only files within a single feature boundary
- An `architect` diff that touches >10 files has been explicitly routed as architect-tier

### 4. Emit Audit Report
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
A single HIGH finding results in FAIL. MEDIUM findings are surfaced but
do not auto-block — the guardrail orchestrator decides escalation.
