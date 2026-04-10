import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

const canvasDir = path.join(ROOT, 'canvas-editor');
const siteDir = path.join(ROOT, 'generated-site');
const agentDir = path.join(ROOT, 'repo-sandbox-agent');

console.log('=================================================');
console.log('  Repo Scaffold — Starting all services...');
console.log('=================================================\n');

if (isWin) {
  // Open dedicated CMD windows for each Next.js dev server
  exec(`start "Canvas Editor :3000" cmd /k "cd /d "${canvasDir}" && npm run dev"`);
  exec(`start "Generated Site :3001" cmd /k "cd /d "${siteDir}" && npm run dev -- -p 3001"`);
  console.log('[canvas-editor] Starting in new window on http://localhost:3000');
  console.log('[generated-site] Starting in new window on http://localhost:3001');
} else {
  // Mac/Linux: background processes with prefixed output
  const fwd = (name, color) => (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(l => console.log(`${color}[${name}]\x1b[0m ${l}`));
  };
  const ce = spawn('npm', ['run', 'dev'], { cwd: canvasDir, stdio: ['ignore', 'pipe', 'pipe'] });
  ce.stdout.on('data', fwd('canvas:3000', '\x1b[36m'));
  ce.stderr.on('data', fwd('canvas:3000', '\x1b[36m'));
  const gs = spawn('npm', ['run', 'dev', '--', '-p', '3001'], { cwd: siteDir, stdio: ['ignore', 'pipe', 'pipe'] });
  gs.stdout.on('data', fwd('site:3001', '\x1b[33m'));
  gs.stderr.on('data', fwd('site:3001', '\x1b[33m'));
  process.on('exit', () => { ce.kill(); gs.kill(); });
}

// Open browser once servers have had time to start
setTimeout(() => {
  const url = 'http://localhost:3000';
  if (isWin) exec(`start ${url}`);
  else if (process.platform === 'darwin') exec(`open "${url}"`);
  else exec(`xdg-open "${url}"`);
  console.log(`\n[browser] Opened ${url} — UI Editor ready`);
}, 6000);

// Run agent REPL in this terminal (inherit stdio so user can type)
console.log('\n[agent] Starting REPL — type prompts below\n');
const agent = spawn('node', ['index.js'], {
  cwd: agentDir,
  stdio: 'inherit',
  shell: false,
});

agent.on('exit', () => process.exit(0));
process.on('SIGINT', () => { agent.kill('SIGINT'); });
process.on('SIGTERM', () => { agent.kill('SIGTERM'); });
