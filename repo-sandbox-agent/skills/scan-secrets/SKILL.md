---
name: scan-secrets
description: >
  Scans a file path or diff content for credential and secret patterns.
  Returns ALLOW or BLOCK with the matched pattern and location.
allowed-tools: Read
---

## Role
Invoked by the guardrail orchestrator on every file_read and file_write
action. Prevents credential exposure across all agent tiers.

## Steps

### For file_read or file_write path check:
1. Extract the `file_path` from the payload.
2. Match the path against the blocked path patterns in DUTIES.md §1.
3. If matched → return `BLOCK` immediately with `match_type: "path"`.
4. If no path match → proceed to content check (for file_write only).

### For file_write content check:
1. Extract the `proposed_diff` from the payload.
2. Scan each added line (lines prefixed with `+`) against the content
   patterns in DUTIES.md §2.
3. If any pattern matches → return `BLOCK` with `match_type: "content"`,
   `pattern_matched`, and the line number.
4. If no matches → return `ALLOW`.

### For scanner output scan:
1. Extract the file listing from the scan result JSON.
2. Match every `file_path` value against blocked path patterns.
3. Remove or flag matched entries before returning the result.

## Output
```json
{
  "verdict": "ALLOW | BLOCK",
  "agent": "secret-sentinel",
  "match_type": "path | content",
  "pattern_matched": "...",
  "location": "..."
}
```
