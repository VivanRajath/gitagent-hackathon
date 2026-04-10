# Known Errors — Hard Requirements

## NEVER touch component files
Components in src/components/ are locked. Edit ONLY site-content.ts, globals.css, layout.tsx.

## fetch_images — agent tool, NEVER in .ts/.tsx files
Do NOT import or call fetch_images in any file. Not a JS module — no such package exists.
Build Pollinations URLs directly as plain strings:
  https://image.pollinations.ai/prompt/harry+potter+castle?width=1600&height=900&nologo=true

## NEVER import these (not installed)
- react-icons, next/image, @heroicons/react, lib/animations, lib/fetchImages
- No component-scoped .css files

## next/image → use plain <img>
WRONG: <Image src="..." /> → crashes (unconfigured hostname)
RIGHT: <img src="https://..." alt="..." />

## Link — never nest <a>
WRONG: <Link href="/"><a>text</a></Link>
RIGHT: <Link href="/">text</Link>

## Globals.css — variable names and structure
CSS variable names are EXACTLY: --color-primary  --color-secondary  --color-bg  --color-text  --font-display
NEVER write --primary, --secondary, --bg, --text — components won't pick them up.
When updating globals.css: file_read it first, replace ONLY the :root { } block, keep every other line identical.
Line 1 must be: @import "tailwindcss";
NEVER delete the body rule or @keyframes blocks — they must stay.

## Exports — always default
export default function ComponentName  ← correct
export function / export const         ← wrong, breaks imports

## Images invisible — always use inline style for image positioning
If images don't show, the cause is Tailwind classes not generating for <img> layout.
WRONG (invisible if Tailwind misses it):
  <img className="absolute inset-0 w-full h-full object-cover" />
RIGHT (always works — inline style):
  <img style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
Rule: all <img> tags that need positioning MUST use inline style={{}}, not Tailwind classes.

## Call tools immediately — no preamble prose before tool calls

## OPEN_EDIT (auto-learned)
- * Call launch_frontend immediately after themed site-content.ts and globals.css are written — without delay or additional prose.

## CODING (auto-learned)
- * When theming a website, always construct Pollinations URLs yourself as plain strings.

## CODING (auto-learned)
- * When updating globals.css, always file_read it first, replace ONLY the :root { } block, and keep every other line identical.

## CODING (auto-learned)
- * When using <img> tags, always use inline style for image positioning.

## CODING (auto-learned)
- * When updating files, always file_read it first, replace ONLY the required lines, and keep every other line identical.
