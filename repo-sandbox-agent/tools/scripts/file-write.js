import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Agent lives at: repo-sandbox-agent/tools/scripts/
// Outer generated-site is at: repo/generated-site/
const GENERATED_SITE_ROOT = path.resolve(__dirname, "..", "..", "..", "generated-site");

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

let { path: filePath, content } = JSON.parse(raw);

// If the agent passes a relative path (e.g. "src/components/Navbar.tsx"),
// anchor it to the outer generated-site — never to CWD.
if (!path.isAbsolute(filePath)) {
  filePath = path.join(GENERATED_SITE_ROOT, filePath);
}

await mkdir(path.dirname(filePath), { recursive: true });
await writeFile(filePath, content, "utf-8");
process.stdout.write(`Written: ${filePath}`);
