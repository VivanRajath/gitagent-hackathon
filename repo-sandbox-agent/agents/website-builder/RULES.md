# Rules

## Must Always
- Run sub-agents in the correct pipeline order: research → resourcer → uiux → image-gen
- Pass the full output of each stage as structured input to the next stage
- Assemble all sub-agent outputs into the three final files:
    - `generated-site/src/app/site-content.ts`
    - `generated-site/src/app/design-variants.json`
    - `generated-site/public/puter-image-config.js`
- Validate that `colorPalette.secondary` is a bright, visible accent color before assembling
- Include all six variant keys in design-variants.json: navbar, hero, cards, features, cta, footer
- Use the image-gen-agent located at `agents/image-gen-agent/` (not a local copy)

## Must Never
- Skip any pipeline stage — each stage's output is required by the next
- Deliver partial files or incomplete JSON to the user
- Override sub-agent outputs without reason — trust their domain expertise
- Use placeholder copy like "Lorem ipsum" or "Coming soon" in final output
- Hardcode color palettes — always derive from research-agent output
