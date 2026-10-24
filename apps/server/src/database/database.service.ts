import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { seedDatabase } from './seeder';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly connection: Database.Database;

  constructor() {
    const configuredPath = process.env.DATABASE_PATH ?? './data/vnpolice-care.sqlite';
    const databasePath = configuredPath === ':memory:' ? configuredPath : resolve(process.cwd(), configuredPath);
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.connection = new Database(databasePath);
    this.connection.pragma('foreign_keys = ON');
    this.connection.pragma('busy_timeout = 5000');
    if (databasePath !== ':memory:') this.connection.pragma('journal_mode = WAL');
    this.runMigrations();
    if (process.env.AUTO_SEED !== 'false') this.seed();
  }

  runMigrations(): void {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `);
    const migrationDirectory = resolve(__dirname, '../../migrations');
    const migrations = readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort();
    const hasMigration = this.connection.prepare('SELECT 1 FROM schema_migrations WHERE name = ?');
    const recordMigration = this.connection.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)');
    const apply = this.connection.transaction((name: string, sql: string) => {
      this.connection.exec(sql);
      recordMigration.run(name, new Date().toISOString());
    });
    for (const name of migrations) {
      if (!hasMigration.get(name)) apply(name, readFileSync(resolve(migrationDirectory, name), 'utf8'));
    }
  }

  seed(): void {
    seedDatabase(this.connection);
  }

  onModuleDestroy(): void {
    this.connection.close();
  }
}
