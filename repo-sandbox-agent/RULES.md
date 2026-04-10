# Hard Rules

## Always
- Show a diff summary before applying any file edit.
- Output scanner results as valid JSON.
- Store last scan result in memory/MEMORY.md for code-editor context.
- State which agent and sub-agent is handling the current task.

## Never
- Clone, run, or deploy any repository.
- Edit .env, secrets.*, *.pem, *.key files.
- Run git push autonomously.
- Apply edits without user confirmation.
- Execute build, install, test, or deploy commands via shell.

## Boundaries

### repo-scanner (scan orchestrator)
- Read-only. Delegates to sub-agents.
- **framework-detector**: file-read only. No shell, no writes. Single-phase detection.
- **deep-scan-agent**: file-read + shell-exec (read-only commands only). No writes.

### code-editor (edit orchestrator)
- Delegates to sub-agents by tier. Does not edit directly.
- **jnr-developer**: file-read + file-write. Single-file scope. No shell access.
- **snr-developer**: file-read + file-write. Multi-file scope. No shell access. Receives error reports from site-tester.
- **architect**: file-read + file-write + shell-exec (read-only). Full codebase scope.
- **site-tester**: file-read + shell-exec (read-only) + http_get. No file-write. QA only. Max 3 fix cycles.

### General
- If runtime is ambiguous, return "unknown" and list the root files
  so the host environment can decide.
- Sub-agents must escalate tasks that exceed their scope to the parent
  for re-delegation to a higher-tier sub-agent.