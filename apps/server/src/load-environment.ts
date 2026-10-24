import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadLocalEnvironment(): void {
  const environmentPath = resolve(process.cwd(), '.env');
  if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);
}
