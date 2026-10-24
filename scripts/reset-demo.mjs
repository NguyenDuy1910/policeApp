import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('Resetting the local database, uploaded evidence, and Vietnamese seed records…');
execFileSync('npm', ['run', 'db:reset'], {
  cwd: repositoryRoot,
  env: process.env,
  stdio: 'inherit',
});

console.log('Admin: admin / DemoAdmin!2026');
console.log('The mobile app removes locally stored report credentials after the reset API returns 404.');
