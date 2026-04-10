import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// repo-sandbox-agent/ root  (2 levels up from tools/scripts/)
const AGENT_ROOT      = path.resolve(__dirname, "..", "..");
// outer generated-site at repo/generated-site/
const GENERATED_SITE  = path.resolve(__dirname, "..", "..", "..", "generated-site");

// Prefixes that live INSIDE repo-sandbox-agent/
const AGENT_PREFIXES = ["skills/", "tools/", "agents/", "memory/", "hooks/", "agent.yaml", "SOUL.md", "RULES.md", "ARCHITECTURE.md"];

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

let { path: filePath } = JSON.parse(raw);

if (!path.isAbsolute(filePath)) {
  const isAgentFile = AGENT_PREFIXES.some((p) => filePath.startsWith(p) || filePath === p);
  filePath = path.join(isAgentFile ? AGENT_ROOT : GENERATED_SITE, filePath);
}

const content = await readFile(filePath, "utf-8");
// Cap output to prevent context overflow / 413 TPM errors on large component files
const MAX_CHARS = 6000;
const output = content.length > MAX_CHARS
  ? content.slice(0, MAX_CHARS) + `\n\n[...truncated ${content.length - MAX_CHARS} chars — file has ${content.length} total chars]`
  : content;
process.stdout.write(output);
