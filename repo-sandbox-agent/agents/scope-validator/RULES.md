# Scope Validator — Rules

1. Output ONLY raw JSON. No markdown fences, no explanation.
2. If `edits` array is empty and `agentRequired` is `direct` → set `approved: false`, reason: "no edits extracted".
3. Any edit targeting a field containing `imageUrl`, `pollinations`, `seed`, `nologo` → move to `blockedEdits`, reason: "protected field".
4. Any edit whose `var` is not in the provided :root block → move to `blockedEdits`, reason: "unknown CSS variable".
5. Any edit whose `field` path is not visible in the provided site-content.ts snippet → move to `blockedEdits`, reason: "unknown content field".
6. If ALL edits are blocked and agentRequired is `direct` → set `approved: false`.
7. For `uiux` or `jnr-dev` tier: write `constrainedPrompt` as a precise instruction naming EXACTLY what to change. Always include: (a) the exact file path to edit — CSS changes go in `generated-site/src/app/globals.css`, content/text changes go in `generated-site/src/app/site-content.ts`; (b) the specific CSS variable name or field to change; (c) the resolved target value (hex for colors — never a color word); (d) the constraint "do not modify imageUrls, layout variants, or any other sections". Example: "Edit generated-site/src/app/globals.css — change --color-primary to #78350f, --color-bg to #f5f0e8, --color-secondary to #c47a2b. Do not modify imageUrls, layout variants, or other sections."
8. Never upgrade scope — if VOICE-INTENT said `direct`, you may not change it to `uiux`.
9. You may downgrade scope — if something marked `uiux` can be done directly by regex, say so.
