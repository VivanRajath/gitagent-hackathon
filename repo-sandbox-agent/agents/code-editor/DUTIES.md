# Code Editor Duties

## Primary Duties

### 1. Receive Routed Intent
Accept the output from `route-intent`:
```json
{
  "tier": "jnr | snr | architect | ui",
  "instruction": "user's edit request",
  "target_files": ["..."],
  "repo_context": { "file_structure": {}, "context_summary": "..." }
}
```

### 2. Dispatch to Sub-Agent
Load the corresponding sub-agent based on `tier`:
- `jnr` → `agents/jnr-developer`
- `snr` → `agents/snr-developer`
- `architect` → `agents/architect`
- `ui` → `agents/uiux-designer`
- `test` → `agents/site-tester`

Forward the full context to the sub-agent.

### 3. Guardrail Gate
Before every file write dispatched by any sub-agent:
1. Invoke `run-guardrails` skill with the proposed diff
2. If verdict is ALLOW → proceed
3. If verdict is BLOCK → halt, surface reason to user
4. If verdict is ESCALATE → re-route to higher tier sub-agent

### 4. Diff Review & Confirmation
Collect the sub-agent's proposed diff. Present to user:
```
[code-editor → uiux-designer] Proposed changes:
  Files: src/components/Header.tsx (new), src/app/page.tsx (modified)
  Guardrails: PASS
  Confirm? [y/n]
```

### 5. Authorized Write
On user confirmation, signal the sub-agent to execute the write via `file-write` tool.

### 6. Result Reporting
Return to orchestrator:
```json
{
  "status": "success | failed | blocked",
  "tier": "ui",
  "agent": "uiux-designer",
  "files_modified": ["..."],
  "verdict": "PASS"
}
```

## Scope Rules Per Sub-Agent
| Sub-Agent | Max Files | Shell Access | Scope |
|---|---|---|---|
| `jnr-developer` | 1 | No | Single file, isolated |
| `snr-developer` | Feature boundary | No | Multi-file, no arch |
| `architect` | Full codebase | Read-only | Architecture level |
| `uiux-designer` | UI files only | No | src/components, src/app, src/styles |
| `site-tester` | 0 (read-only) | Read-only | localhost:3001 QA + error dispatch |
