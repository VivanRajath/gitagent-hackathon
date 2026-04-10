---
name: site-tester
description: >
  QA skill: screenshot the running Next.js dev server, analyse visual output
  against user intent, harvest console errors, and dispatch fix reports to
  snr-developer. Loops up to 3 cycles.
allowed-tools: Read shell_exec http_get
---

# Site Tester Skill

## Execution Steps

1. **Ping** `http://localhost:3001` — abort with `unreachable` if no response.

2. **Screenshot** — run puppeteer one-liner via `shell_exec`:
   ```bash
   node -e "const p=require('puppeteer');(async()=>{const b=await p.launch({args:['--no-sandbox']});const pg=await b.newPage();await pg.setViewport({width:1280,height:900});await pg.goto('http://localhost:3001',{waitUntil:'networkidle2',timeout:30000});await pg.screenshot({path:'/tmp/site-tester-snap.png'});await b.close();})();"
   ```
   Fallback: `curl -s http://localhost:3001 -o /tmp/site-tester.html`

3. **Harvest console errors** from:
   - puppeteer `page.on('console')` capture
   - `.next/` build output files
   - `/tmp/nextjs-dev.log` if available

4. **Analyse** screenshot or HTML against user intent. Score: `pass | warn | fail`.

5. **If errors or warn/fail**: assemble error report JSON (see DUTIES.md §5).

6. **Dispatch** error report to `snr-developer` via `code-editor`.

7. **Wait** for `snr-developer` fix confirmation, then **loop** from step 1.
   Max 3 cycles. On 3rd failure, escalate full report to user.

8. **If clean**: return `{ "status": "clean", ... }` to `code-editor`.

## Constraints
- Read + shell (read-only) only. No writes.
- Do not install packages during testing.
- Do not open `:3000`.
