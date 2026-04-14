/**
 * AgentBridge.ts
 *
 * Connects the spatial UI to the repo-sandbox-agent's HTTP API on port 3002.
 * Provides two capabilities:
 *   1. requestVariations — ask the AI to generate 5 component design variations
 *   2. commitVariation   — apply the chosen variation to the live source file
 *   3. cleanup           — delete temporary variation files after session ends
 */

const AGENT_API = 'http://localhost:3002/command';

export interface VariationData {
  id: string;
  label: string;
  description: string;
  code: string;
  color: string;
}

// Accent colours allocated per variation slot (consistent visual identity)
const VARIATION_COLORS = ['#ef4444', '#facc15', '#ec4899', '#22d3ee', '#a78bfa'];

/**
 * Build the prompt that the agent receives to generate 5 UI variations.
 * The agent must return a strict JSON block so we can parse structured data.
 */
function buildVariationPrompt(componentId: string, currentCode: string, theme: string): string {
  return `[AGENT-BRIDGE] You are a UI code generator acting as the uiux-designer persona.

The user is spatially editing their website by pointing at components with hand tracking.
They have pointed at component: "${componentId}".

## Current source code
\`\`\`tsx
${currentCode}
\`\`\`

## Active site theme
${theme}

## Task
Generate exactly 5 distinct, complete React TSX component designs for "${componentId}".
Each variation must:
- Be a self-contained valid Next.js React functional component with NO external imports beyond 'react'.
- Use ONLY Tailwind CSS classes (already available in the project).
- Use CSS variables: var(--color-primary), var(--color-accent), var(--color-bg), var(--color-surface).
- Export the component using the SAME export name as the original (e.g. \`export { Navbar }\`).
- Have a unique visual style (e.g. glassmorphic, brutalist, minimal, bold, holographic).
- Keep the same nav links and content as the original.

## Response format — STRICTLY this JSON, no prose, no markdown fences:
[
  { "label": "...", "description": "...", "code": "..." },
  { "label": "...", "description": "...", "code": "..." },
  { "label": "...", "description": "...", "code": "..." },
  { "label": "...", "description": "...", "code": "..." },
  { "label": "...", "description": "...", "code": "..." }
]`;
}

/**
 * Send a prompt to the REPL agent at localhost:3002 and stream the response text.
 * Returns the full accumulated text when done.
 */
async function sendToAgent(prompt: string, onProgress?: (text: string) => void): Promise<string> {
  const response = await fetch(AGENT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Agent API returned ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onProgress?.(fullText);
  }

  return fullText;
}

function mapVariations(arr: Array<{ label?: string; description?: string; code?: string }>): VariationData[] {
  return arr.slice(0, 5).map((v, i) => ({
    id: `variation_${i + 1}`,
    label: v.label ?? `Variation ${i + 1}`,
    description: v.description ?? '',
    code: v.code ?? '',
    color: VARIATION_COLORS[i],
  }));
}

/**
 * Extract the JSON array from an agent response that may contain surrounding prose
 * or markdown fences. Uses multiple strategies in order of reliability.
 */
function extractJsonArray(text: string): VariationData[] {
  const cleaned = text.replace(/\[done\]/g, '').trim();

  // Strategy 1: extract content between ```json ... ``` or ``` ... ``` fences
  const fenceMatches = [...cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const m of fenceMatches) {
    const inner = m[1].trim();
    if (!inner.startsWith('[')) continue;
    try {
      const arr = JSON.parse(inner);
      if (Array.isArray(arr) && arr.length > 0) return mapVariations(arr);
    } catch { /* try next */ }
  }

  // Strategy 2: find the outermost balanced [ ... ] in the text
  const start = cleaned.indexOf('[');
  if (start !== -1) {
    let depth = 0, end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '[') depth++;
      else if (cleaned[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try {
        const arr = JSON.parse(cleaned.slice(start, end + 1));
        if (Array.isArray(arr) && arr.length > 0) return mapVariations(arr);
      } catch { /* try next */ }
    }
  }

  // Strategy 3: greedy regex fallback
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) return mapVariations(arr);
    } catch { /* fall through */ }
  }

  throw new Error('No valid JSON array found in agent response');
}

/**
 * Main public function: Ask the agent to generate 5 variations for a component.
 * Returns structured variation data that can be displayed in the spatial menu.
 */
export async function requestVariations(
  componentId: string,
  currentCode: string,
  theme: string,
  onProgress?: (text: string) => void
): Promise<VariationData[]> {
  const prompt = buildVariationPrompt(componentId, currentCode, theme);
  const responseText = await sendToAgent(prompt, onProgress);
  return extractJsonArray(responseText);
}

/**
 * Write a chosen variation's code into the component file via the agent.
 * This triggers Next.js hot-reload automatically.
 * 
 * @param componentPath  Absolute path to the component file on disk
 * @param code           The new TSX source to write
 */
export async function commitVariation(componentPath: string, code: string): Promise<void> {
  const prompt = `[AGENT-BRIDGE] You are the jnr-developer persona making a targeted file edit.
  
Overwrite the file at path:
${componentPath}

With EXACTLY this content — no changes, no additions, no commentary:
\`\`\`tsx
${code}
\`\`\`

Call file_write with path="${componentPath}" and the content above. Respond only with "Done." when complete.`;

  await sendToAgent(prompt);
}

/**
 * Map a component element ID (from SpatialTarget) to its source file path on disk.
 * Any new spatial targets added to page.tsx can be registered here.
 */
export function resolveComponentPath(componentId: string): string {
  const MAP: Record<string, string> = {
    navbar:         'src/components/Navbar.tsx',
    hero:           'src/components/Hero.tsx',
    'card-eleven':  'src/components/Card.tsx',
    'card-mike':    'src/components/Card.tsx',
    footer:         'src/components/Footer.tsx',
    cta:            'src/components/CTABanner.tsx',
    featurestrip:   'src/components/FeatureStrip.tsx',
  };
  return MAP[componentId] ?? `src/components/${componentId}.tsx`;
}
