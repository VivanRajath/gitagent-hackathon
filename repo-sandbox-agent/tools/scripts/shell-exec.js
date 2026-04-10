import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const ALLOWED_CMDS = ["ls", "find", "grep", "cat", "head", "tail", "tree", "wc", "echo", "pwd", "stat"];

let raw = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) raw += chunk;

const { command, cwd = "." } = JSON.parse(raw);

const [cmd] = command.trim().split(/\s+/);
if (!ALLOWED_CMDS.includes(cmd)) {
  process.stderr.write(`Blocked: "${cmd}" is not a permitted read-only command.`);
  process.exit(1);
}

try {
  const { stdout, stderr } = await execFileAsync("bash", ["-c", command], {
    cwd,
    timeout: 10_000,
    maxBuffer: 512 * 1024,
  });
  process.stdout.write(stdout || stderr || "(no output)");
} catch (e) {
  process.stdout.write(e.stdout || e.message);
}
