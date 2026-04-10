---
name: route-intent
description: >
  Analyzes user query against the codebase structure and classifies complexity
  to assign one of four sub-agents: jnr-developer, snr-developer, architect,
  or uiux-designer. The uiux-designer tier covers all UI/UX layer requests.
allowed-tools: Read
---

## Objective
Intelligently route a user's code-edit instruction to the appropriate
sub-agent in order to manage LLM resource costs and scope discipline.

## Inputs
- User Instruction
- Repo-Scanner Output (file_structure and context_summary)

## Routing Logic

### Step 1: UI/UX Check (highest priority — run first)
Assign tier **`ui`** → `uiux-designer` if ANY of the following are true:
- Instruction mentions: "button", "card", "header", "navbar", "footer", "layout", "design",
  "UI", "UX", "style", "color", "theme", "spacing", "component", "responsive", "animation",
  "font", "icon", "image", "hero", "banner", "modal", "drawer", "sidebar", "grid", "flex"
- Target files are `.tsx`, `.jsx`, `globals.css`, `tailwind.config.*`, any file in `src/components/`
- User says "draw", "sketch", "canvas", "hand tracker", "frontend editor", "visual editor"
- Canvas data (tldraw shapes) is present in the input
- The request is about the visual/browser layer, not logic or data

### Step 2: Complexity Classification (for non-UI requests)
Evaluate instruction severity:
- **Low**: single file fix, typo, style tweak (non-UI), small isolated logic handler.
  Does not require broad context. → tier `jnr`
- **Medium**: multi-file interactions, new route/endpoint, integration tasks, new non-UI component.
  Needs overview context. → tier `snr`
- **High**: systemic architecture refactors, resolving memory leaks, ambiguous design changes,
  complex bug hunting requiring full repo traversal. → tier `architect`

### Step 0: QA / Test Check (run before Step 1)
Assign tier **`test`** → `site-tester` if ANY of the following are true:
- Instruction contains: "test the site", "check the site", "QA", "validate the site",
  "screenshot", "does it work", "any errors", "check console", "console errors", "hydration"
- `architect-website` pipeline has just completed (auto-trigger)

### Step 3: Tier Assignment
| Tier | Sub-Agent | Model Cost | Scope |
|---|---|---|---|
| `test` | `site-tester` | Standard | Read-only QA at localhost:3001 |
| `ui` | `uiux-designer` | Standard | UI layer: components, layouts, styles |
| `jnr` | `jnr-developer` | Low | 1 file, isolated |
| `snr` | `snr-developer` | Standard | Feature boundary, multi-file |
| `architect` | `architect` | High | Full codebase |

## Output
Return a single JSON object:
```json
{
  "tier": "test | ui | jnr | snr | architect",
  "sub_agent": "site-tester | uiux-designer | jnr-developer | snr-developer | architect",
  "reason": "one-line justification",
  "target_files": ["<file paths if determinable>"],
  "canvas_triggered": false
}
```
Set `canvas_triggered: true` when tier is `ui` — this signals the orchestrator to activate the canvas-editor interface.
Set `canvas_triggered: false` for `test` tier — site-tester uses the dev server, not the canvas.

## Examples
| Instruction | Tier |
|---|---|
| "Fix the typo in utils.ts line 42" | `jnr` |
| "Add a new /about page with hero and cards" | `ui` |
| "Create a new API route for user auth" | `snr` |
| "Refactor all middleware to use a new base class" | `architect` |
| "Make the homepage look like my hand drawing" | `ui` |
| "Add a navbar with links to Home, About, Contact" | `ui` |
| "Update the color theme to dark mode" | `ui` |
| "Test the site" | `test` |
| "Check the console for errors" | `test` |
| "Does the generated site work?" | `test` |
| "Take a screenshot of the site" | `test` |
