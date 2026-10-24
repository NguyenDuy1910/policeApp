import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

writeFileSync(resolve(import.meta.dirname, '../dist/cjs/package.json'), '{"type":"commonjs"}\n');
writeFileSync(resolve(import.meta.dirname, '../dist/esm/package.json'), '{"type":"module"}\n');
