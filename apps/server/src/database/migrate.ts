import { loadLocalEnvironment } from '../load-environment';
import { DatabaseService } from './database.service';

loadLocalEnvironment();
const database = new DatabaseService();
database.runMigrations();
database.onModuleDestroy();
console.log('Database migrations applied.');
