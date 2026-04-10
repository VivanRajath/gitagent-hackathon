---
name: test-site
description: >
  Orchestrates the full QA cycle for a running Next.js dev site. Dispatches
  site-tester, receives error reports, routes fixes to snr-developer, and
  confirms the site is clean before closing.
allowed-tools: Read shell_exec http_get
---

# Test Site Skill

## Trigger Conditions
- Website generation completes (auto-triggered by `architect-website` pipeline)
- User says: "test the site", "check the site", "QA", "validate", "does it work",
  "screenshot", "any errors", "check console"

## Execution Steps

1. **Activate `site-tester`** — forward user intent description as context:
   ```json
   {
     "intent": "<original user request>",
     "url": "http://localhost:3001",
     "max_cycles": 3
   }
   ```

2. **Receive report** from `site-tester`.

3. **If `status === "clean"`** — present visual summary to user and finish.

4. **If errors present**:
   a. Log: `[site-tester → snr-developer] Forwarding N error(s) for remediation.`
   b. Forward `fix_instruction` + `console_errors[]` to `snr-developer` via `code-editor`.
   c. After `snr-developer` writes fixes, signal `site-tester` to re-test.

5. **After 3 failed cycles** — surface the full error report to user with:
   ```
   [site-tester] 3 fix cycles exhausted. Escalating to user.
   Remaining errors: <list>
   ```

## Auto-trigger
`architect-website` MUST call `test-site` as its final step after
`launch_frontend('http://localhost:3001')`.

## Output to User
```
[site-tester] Visual score: pass ✓
[site-tester] No console errors detected.
[site-tester] Site matches intent: <one-line summary>
```
or
```
[site-tester → snr-developer] Found 2 error(s). Sending for fix (cycle 1/3)...
[snr-developer] Applying fixes to layout.tsx, globals.css...
[site-tester] Re-testing... Visual score: pass ✓
```
