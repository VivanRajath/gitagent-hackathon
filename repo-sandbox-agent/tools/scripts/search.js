import { readdir, readFile, stat } from "fs/promises";
import path from "path";

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

const { pattern, path: searchPath, file_glob, case_insensitive } = JSON.parse(raw);

const flags = case_insensitive ? "gi" : "g";
const regex = new RegExp(pattern, flags);

async function* walkFiles(dir, glob) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
      yield* walkFiles(full, glob);
    } else if (entry.isFile()) {
      if (!glob || matchGlob(entry.name, glob)) yield full;
    }
  }
}

function matchGlob(name, glob) {
  const pattern = glob.replace(/\./g, "\\.").replace(/\*/g, ".*");
  return new RegExp(`^${pattern}$`).test(name);
}

const matches = [];
const s = await stat(searchPath).catch(() => null);

if (s?.isFile()) {
  const lines = (await readFile(searchPath, "utf-8")).split("\n");
  lines.forEach((line, i) => {
    if (regex.test(line)) matches.push({ file: searchPath, line: i + 1, content: line.trim() });
  });
} else {
  for await (const file of walkFiles(searchPath, file_glob)) {
    try {
      const lines = (await readFile(file, "utf-8")).split("\n");
      lines.forEach((line, i) => {
        regex.lastIndex = 0;
        if (regex.test(line)) matches.push({ file, line: i + 1, content: line.trim() });
      });
    } catch { /* skip binary files */ }
  }
}

process.stdout.write(JSON.stringify({ matches, total: matches.length }, null, 2));
