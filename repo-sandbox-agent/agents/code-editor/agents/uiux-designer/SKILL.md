---
name: uiux-designer
description: >
  UI/UX designer skill — activates canvas-editor hand-tracking interface,
  receives tldraw canvas sketch data, generates Next.js components, and syncs
  them to generated-site via /api/sync.
allowed-tools: Read Write Bash
---

# UI/UX Designer Skill

## Trigger
When `route-intent` outputs `"tier": "ui"` → this skill is loaded.

## Steps

1. **Activate canvas-editor**: Signal frontend to open the hand-tracking UI at `http://localhost:3000`
2. **Receive canvas data**: `canvasData.shapes` array from tldraw via `GitAgentRunner`
3. **Parse shapes**: Map tldraw primitives → React component hierarchy (see DUTIES.md §3)
4. **Generate code**: Next.js/Tailwind components with ARIA and semantic HTML
5. **Show diff**: Present component hierarchy and file list to user
6. **Guardrail check**: Return diff to `code-editor` → `run-guardrails` → ALLOW/BLOCK
7. **Sync**: On ALLOW + confirmation → POST to `/api/sync` → confirm paths
8. **Report**: Return structured result to `code-editor`

## Canvas-Editor Integration
The canvas-editor (Next.js app at `repo/canvas-editor/`) provides:
- `HandTracker` component: MediaPipe hand detection → cursor + pinch gestures
- `Tldraw` canvas: shape drawing with hand as pointer
- `GitAgentRunner` component: sends shapes to agent, displays status
- `/api/sync` route: writes generated code to `generated-site/`
