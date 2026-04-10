/**
 * qa-site.js — site-tester tool
 *
 * Reads stdin: { url, intent }
 * 1. Pings the URL (retries up to 6×5s = 30s for dev server to boot)
 * 2. Fetches the HTML and checks for Next.js compile/runtime errors
 * 3. Checks that key layout sections from `intent` are present
 * 4. Returns structured JSON: { status, http_status, errors[], warnings[], section_check{}, summary }
 *
 * No external dependencies — only Node.js built-ins.
 */

import http from "http";
import https from "https";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
  });
}

function fetchUrl(url, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, (res) => {
      let body = "";
      res.setEncoding("utf-8");
      res.on("data", (c) => { body += c; });
      res.on("end", () => resolve({ statusCode: res.statusCode, body }));
    });
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
  });
}

async function fetchWithRetry(url, retries = 6, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetchUrl(url);
      return result;
    } catch (e) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw e;
      }
    }
  }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function extractNextError(rawHtml) {
  // Decode HTML entities first so patterns match even inside <pre> blocks
  const html = decodeHtmlEntities(rawHtml);

  // Turbopack / Next.js build & runtime error patterns
  const patterns = [
    // Build / compile errors (Turbopack)
    /Unterminated string constant[^\n]{0,400}/,
    /Parsing ecmascript source code failed[\s\S]{0,600}/,
    /Build Error[\s\S]{0,600}/,
    /Failed to compile[\s\S]{0,600}/,
    /Compilation error[\s\S]{0,400}/,
    /Unexpected token[^\n]{0,400}/,
    /Expected[^\n]{0,400}/,
    // Module resolution errors
    /Module not found[^\n]{0,400}/,
    /Cannot find module[^\n]{0,400}/,
    /Cannot find name[^\n]{0,400}/,
    // JS runtime errors
    /SyntaxError[^\n]{0,400}/,
    /ReferenceError[^\n]{0,400}/,
    /TypeError[^\n]{0,400}/,
    /Error:\s[^\n]{0,400}/,
    /Unhandled Runtime Error[\s\S]{0,500}/,
    // Hydration
    /Hydration failed[\s\S]{0,400}/,
    /hydration mismatch[\s\S]{0,400}/i,
    // Generic Next.js error page title
    /Application error[^\n]{0,300}/,
  ];

  // Also check for file:line:col pattern that Turbopack emits
  const fileLinePattern = /\.\/(src|app|pages)\/[^\s]+\.tsx?:\d+:\d+[\s\S]{0,400}/g;
  const fileMatches = [...html.matchAll(fileLinePattern)].map((m) => m[0]);

  const found = [];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const cleaned = m[0]
        .replace(/<[^>]+>/g, " ")   // strip remaining HTML tags
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 400);
      if (cleaned.length > 10) found.push(cleaned);
    }
  }
  for (const fm of fileMatches) {
    const cleaned = fm.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 400);
    if (cleaned.length > 10) found.push(cleaned);
  }

  return [...new Set(found)];
}

function checkSections(html, intent) {
  const lower = html.toLowerCase();
  const intentLower = (intent || "").toLowerCase();

  // Standard sections always expected in generated sites
  const standard = ["navbar", "hero", "footer"];
  // Optional sections inferred from intent
  const optional = [];
  if (intentLower.includes("card")) optional.push("card");
  if (intentLower.includes("feature")) optional.push("feature");
  if (intentLower.includes("cta") || intentLower.includes("call to action")) optional.push("cta");
  if (intentLower.includes("gallery")) optional.push("gallery");

  const checks = {};
  for (const s of [...standard, ...optional]) {
    checks[s] = lower.includes(s);
  }
  return checks;
}

function classifyError(msg) {
  if (/hydrat/i.test(msg)) return "hydration";
  if (/unterminated|parsing ecmascript|build error|failed to compile|unexpected token|compilation error/i.test(msg)) return "compile";
  if (/module not found|cannot find module|cannot find name/i.test(msg)) return "import";
  if (/syntax/i.test(msg)) return "compile";
  if (/runtime|reference|type/i.test(msg)) return "runtime";
  return "unknown";
}

function hypothesizeError(type, msg) {
  if (/unterminated string/i.test(msg))
    return "JSX syntax error: likely a <link> or <script> tag missing the self-closing /> in a .tsx file, OR a string literal spanning multiple lines without backslash continuation. Fix: open layout.tsx, find the <link> tag and change > to />.";
  if (/parsing ecmascript/i.test(msg))
    return "Turbopack could not parse the file as valid TypeScript/JSX. Common causes: raw HTML tags without self-closing /> (e.g. <link>, <meta>, <br>), unescaped & in JSX attributes, or a missing export default.";
  if (type === "hydration")
    return "Browser extension injecting attributes (e.g. cz-shortcut-listen). Fix: add suppressHydrationWarning={true} to <body> in layout.tsx.";
  if (type === "import")
    return "A component import is broken — file may be missing or the path is wrong. Check imports in page.tsx.";
  if (type === "compile")
    return "Syntax or compilation error in a generated file. Read the file and check for malformed JSX, missing brackets, or invalid TypeScript.";
  return "Runtime JavaScript error — check component logic and props.";
}

(async () => {
  const raw = await readStdin();
  let args = {};
  try { args = JSON.parse(raw); } catch { /* empty args */ }

  const url = args.url || "http://localhost:3001";
  const intent = args.intent || "";

  // ── 1. Fetch page ────────────────────────────────────────────────────────────
  let fetchResult;
  try {
    fetchResult = await fetchWithRetry(url, 6, 5000);
  } catch (e) {
    process.stdout.write(JSON.stringify({
      status: "unreachable",
      http_status: null,
      errors: [{ type: "network", message: `Dev server not responding at ${url}: ${e.message}`, hypothesis: "Dev server may not have started yet. Run npm run dev in generated-site/" }],
      warnings: [],
      section_check: {},
      summary: `UNREACHABLE: ${url} — ${e.message}`,
    }));
    process.exit(0);
  }

  const { statusCode, body: html } = fetchResult;

  // ── 2. Compile / runtime error extraction ────────────────────────────────────
  const rawErrors = extractNextError(html);
  const errors = rawErrors.map((msg) => {
    const type = classifyError(msg);
    // Extract file path from Turbopack error format "./src/app/layout.tsx:1:108"
    const fileMatch = msg.match(/\.\/(src|app|pages)\/[^\s:]+\.tsx?/);
    const lineMatch = msg.match(/:(\d+):\d+/);
    return {
      type,
      message: msg,
      file: fileMatch ? fileMatch[0] : null,
      line: lineMatch ? parseInt(lineMatch[1]) : null,
      hypothesis: hypothesizeError(type, msg),
    };
  });

  // HTTP 500 = compile error even if we didn't match text
  if (statusCode >= 500 && errors.length === 0) {
    errors.push({
      type: "compile",
      message: `Server returned HTTP ${statusCode} — Next.js compilation likely failed.`,
      file: null,
      line: null,
      hypothesis: "Check generated component files for syntax errors.",
    });
  }

  // ── 3. Section presence check ────────────────────────────────────────────────
  const section_check = checkSections(html, intent);
  const missingSections = Object.entries(section_check)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  const warnings = missingSections.map((s) => ({
    type: "missing_section",
    message: `Expected section "${s}" not found in rendered HTML.`,
    hypothesis: `Component <${s.charAt(0).toUpperCase() + s.slice(1)}> may not be imported in page.tsx or component file may be empty.`,
  }));

  // ── 4. Visual checks — image rendering, CSS variable usage ──────────────────
  const visualIssues = [];

  // Check: <img> tags that use only Tailwind classes for positioning (no inline style)
  // These will be invisible if Tailwind JIT doesn't scan the file
  const imgTagsWithTailwindOnly = [...html.matchAll(/<img[^>]*className="[^"]*(?:absolute|inset-0|w-full|h-full)[^"]*"[^>]*(?!style=)[^>]*>/gi)];
  if (imgTagsWithTailwindOnly.length > 0) {
    visualIssues.push({
      type: "invisible_image",
      message: `${imgTagsWithTailwindOnly.length} <img> tag(s) use only Tailwind classes for layout (no inline style). Images will be invisible if Tailwind doesn't generate those classes.`,
      fix: "Replace className positioning with inline style: style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}",
    });
  }

  // Check: img tags with empty or missing src
  const emptyImgSrc = [...html.matchAll(/<img[^>]*src=["'](\s*|undefined|null)["'][^>]*>/gi)];
  if (emptyImgSrc.length > 0) {
    visualIssues.push({
      type: "empty_image_src",
      message: `${emptyImgSrc.length} <img> tag(s) have empty or null src. Images will not render.`,
      fix: "Check site-content.ts imageUrl fields — they must be valid Pollinations URLs with &seed= parameter.",
    });
  }

  // Check: CSS variables used but :root likely missing them (wrong names)
  const hasCSSVars = html.includes('--color-primary') || html.includes('--color-secondary');
  const hasWrongVarNames = html.includes('var(--primary)') || html.includes('var(--secondary)') || html.includes('var(--bg)');
  if (hasWrongVarNames) {
    visualIssues.push({
      type: "wrong_css_variables",
      message: "Components reference CSS variables with wrong names (--primary, --secondary, --bg). Colors will not apply.",
      fix: "In globals.css :root block, variable names must be --color-primary, --color-secondary, --color-bg, --color-text",
    });
  }

  if (visualIssues.length > 0) {
    for (const vi of visualIssues) warnings.push({ type: vi.type, message: vi.message, hypothesis: vi.fix });
  }

  // ── 5. Visual score ───────────────────────────────────────────────────────────
  let visual_score = "pass";
  if (errors.length > 0) visual_score = "fail";
  else if (warnings.length > 0) visual_score = "warn";

  // ── 6. Build summary ─────────────────────────────────────────────────────────
  let summary = `HTTP ${statusCode} — visual score: ${visual_score}. `;
  if (errors.length === 0 && warnings.length === 0) {
    summary += "No errors detected. All expected sections found.";
  } else {
    if (errors.length > 0) summary += `${errors.length} error(s): ${errors.map((e) => e.type).join(", ")}. `;
    if (warnings.length > 0) summary += `${warnings.length} missing section(s): ${missingSections.join(", ")}.`;
  }

  // ── 7. Build fix instruction for snr-developer ───────────────────────────────
  let fix_instruction = null;
  if (errors.length > 0 || warnings.length > 0) {
    const parts = [];
    for (const e of errors) {
      if (e.type === "hydration") {
        parts.push("In layout.tsx: add suppressHydrationWarning={true} to the <body> element.");
      } else if (/unterminated string/i.test(e.message)) {
        const target = e.file ? e.file : "src/app/layout.tsx";
        parts.push(
          `COMPILE FIX REQUIRED in ${target}: ` +
          `Read the file, find any <link>, <meta>, or <br> HTML tags and ensure they are ` +
          `self-closing JSX (ending with /> not >). Also ensure <body> has suppressHydrationWarning={true}.`
        );
      } else if (e.type === "compile" || e.type === "import") {
        const target = e.file ? e.file : "the component file";
        parts.push(`Fix in ${target}: ${e.hypothesis}`);
      } else {
        parts.push(`Fix runtime error in ${e.file || "page.tsx"}: ${e.message.slice(0, 150)}`);
      }
    }
    for (const w of warnings) {
      if (w.type === "invisible_image") {
        parts.push(`VISUAL FIX: file_read Hero.tsx and CTABanner.tsx — replace <img className="absolute inset-0 w-full h-full object-cover"> with <img style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}>`);
      } else if (w.type === "wrong_css_variables") {
        parts.push(`CSS FIX: file_read globals.css — rename --primary to --color-primary, --secondary to --color-secondary, --bg to --color-bg, --text to --color-text in the :root block`);
      } else {
        parts.push(w.hypothesis);
      }
    }
    fix_instruction = parts.join(" | ");
  }

  const output = {
    status: visual_score === "pass" ? "clean" : "errors",
    http_status: statusCode,
    url,
    visual_score,
    errors,
    warnings,
    section_check,
    summary,
    ...(fix_instruction ? { fix_instruction, recommended_tier: "snr" } : {}),
  };

  process.stdout.write(JSON.stringify(output, null, 2));
  process.exit(0);
})();
