import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadLocalEnvironment } from '../load-environment';
import { DatabaseService } from './database.service';

// Destructive: deletes every record and stored attachment, then reloads the seed data.
// Runs in place inside one transaction, so a running API keeps working and never observes an empty database.
const TABLES_IN_DEPENDENCY_ORDER = ['report_status_history', 'reports', 'reviews', 'places', 'police_units', 'admin_users'] as const;

loadLocalEnvironment();
process.env.AUTO_SEED = 'false';
const database = new DatabaseService();
const { connection } = database;
const uploadDirectory = resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
if (existsSync(uploadDirectory)) {
  for (const name of readdirSync(uploadDirectory)) {
    if (name !== '.gitkeep') rmSync(resolve(uploadDirectory, name), { recursive: true, force: true });
  }
}

const reset = connection.transaction(() => {
  for (const table of TABLES_IN_DEPENDENCY_ORDER) connection.exec(`DELETE FROM ${table}`);
  connection
    .prepare(`DELETE FROM sqlite_sequence WHERE name IN (${TABLES_IN_DEPENDENCY_ORDER.map(() => '?').join(', ')})`)
    .run(...TABLES_IN_DEPENDENCY_ORDER);
  database.seed();
});
reset();
database.onModuleDestroy();

console.log('Database reset: all records replaced with seed data.');
