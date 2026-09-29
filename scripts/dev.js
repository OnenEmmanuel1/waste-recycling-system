import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';
import 'dotenv/config';

const require = createRequire(import.meta.url);
const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
const composeDb = spawnSync(docker, ['compose', 'ps', '--status', 'running', '-q', 'db'], { encoding: 'utf8' });
const usesComposeDb = composeDb.status === 0 && composeDb.stdout.trim().length > 0;
const env = {
  ...process.env,
  APP_PORT: usesComposeDb ? (process.env.DEV_PORT || '3101') : (process.env.DEV_PORT || process.env.APP_PORT || '3000'),
};

if (usesComposeDb) {
  env.DB_HOST = '127.0.0.1';
  env.DB_PORT = process.env.DB_FORWARD_PORT || '3309';
}

console.log(`Development server using MySQL ${env.DB_HOST || '127.0.0.1'}:${env.DB_PORT || '3306'}${usesComposeDb ? ' (Compose)' : ''}`);

const child = spawn(process.execPath, [require.resolve('nodemon/bin/nodemon.js'), 'src/server.js'], {
  env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', (error) => {
  console.error(`Unable to start the development server: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
