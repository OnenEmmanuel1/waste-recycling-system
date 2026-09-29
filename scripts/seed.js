import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const run = (command, args) => spawnSync(command, args, { encoding: 'utf8' });
const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
const composeApp = run(docker, ['compose', 'ps', '--status', 'running', '-q', 'app']);

if (composeApp.status === 0 && composeApp.stdout.trim()) {
  const result = run(docker, ['compose', 'exec', '-T', 'app', 'node', 'scripts/setup-database.js', '--seed-only']);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
} else {
  const result = run(process.execPath, ['scripts/setup-database.js', '--seed-only']);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
