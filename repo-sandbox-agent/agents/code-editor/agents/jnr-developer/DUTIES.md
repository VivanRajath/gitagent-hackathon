# Junior Developer Duties

## Primary Duties
1. Read the single target file via `file-read`.
2. Apply the minimal, precise patch required.
3. Generate a unified diff (no more than 30 lines changed).
4. Run `code-review` on the patch.
5. If PASS → present diff to code-editor for guardrail check.
6. On ALLOW + confirmation → write via `file-write`.

## Scope Check
If the instruction requires changes to more than 1 file:
- Do NOT proceed.
- Return: `{ "escalate": "snr", "reason": "<why two files are needed>" }`

## Out of Scope
- Multi-file changes
- New component creation spanning multiple files
- Shell commands
- Architecture decisions
- UI/UX layout changes (→ `uiux-designer`)
