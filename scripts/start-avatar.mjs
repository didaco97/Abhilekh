import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const env = { ...process.env };
for (const name of Object.keys(env)) if (/API_KEY|AUTH_TOKEN/.test(name)) delete env[name];
const child = spawn(process.env.AVATAR_PYTHON || 'python', ['-u', 'services/avatar/worker.py', ...process.argv.slice(2)],
  { stdio: 'inherit', env, windowsHide: true });
child.on('error', error => { console.error(`Avatar worker could not start: ${error.message}`); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
