---
name: ui-builder
description: >
  Parses canvas sketch data from the canvas-editor (tldraw + HandTracker) and
  generates Next.js React components. Syncs the output to the generated-site
  project via the /api/sync endpoint. This is the primary skill of the
  uiux-designer persona in the code-editor subsystem.
allowed-tools: Read Write Bash
---

# UI Builder Skill

## Trigger
This skill is invoked when:
- The orchestrator routes a task to `uiux-designer` tier (UI/UX request detected)
- The canvas-editor sends shape data to the agent after the user draws on the hand-tracking canvas

## Inputs
- `canvasData.shapes`: Array of tldraw shape objects with `{id, type, x, y, w, h, props}`
- `targetProject`: Path to the Next.js project being edited (default: `../generated-site`)
- `instruction`: Optional natural language description from the user

## Steps

### Step 1: Parse Canvas Shapes
1. Receive `canvasData.shapes` from the canvas-editor frontend
2. Sort shapes by `y` coordinate (top-to-bottom reading order)
3. Map each shape to a UI primitive using DUTIES.md §3 mapping rules
4. Build a component hierarchy tree:
   ```
   Page
   └── Header (top full-width rect)
       └── Nav links (text annotations)
   └── Main (center large rect)
       ├── Card (rounded rect, repeated)
       └── ...
   └── Footer (bottom full-width rect)
   ```

### Step 2: Generate Component Files
For each identified component:
1. Create `src/components/<ComponentName>.tsx` with:
   - Proper TypeScript props interface
   - Tailwind CSS classes matching the spatial layout
   - Semantic HTML (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`)
   - ARIA attributes (`aria-label`, `role`, `aria-current` etc.)
2. Update or create `src/app/page.tsx` to compose the generated components

### Step 3: Show Diff
Before writing, output:
```
[uiux-designer] Proposed component hierarchy:
  Page → Header, Main(Cards×N), Footer

[uiux-designer] Files to write:
  + src/components/Header.tsx  (new)
  + src/components/Card.tsx    (new)
  ~ src/app/page.tsx           (updated)
```

### Step 4: Sync via API
On user confirmation, POST each file to the canvas-editor's `/api/sync`:
```json
{
  "filePath": "src/components/Header.tsx",
  "content": "<generated code>"
}
```
Confirm success with the synced path returned in the response.

### Step 5: Report
Output a summary:
```
[uiux-designer] Synced 3 files to generated-site:
  ✓ src/components/Header.tsx
  ✓ src/components/Card.tsx
  ✓ src/app/page.tsx
```

## Guardrails
- Never write to paths outside `src/app/`, `src/components/`, `src/styles/`
- Always run through the guardrail orchestrator (`run-guardrails`) before file_write
- If any HIGH severity finding from `diff-auditor` → abort and surface to user
