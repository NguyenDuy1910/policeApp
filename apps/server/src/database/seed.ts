import { loadLocalEnvironment } from '../load-environment';
import { DatabaseService } from './database.service';

loadLocalEnvironment();
process.env.AUTO_SEED = 'false';
const database = new DatabaseService();
database.seed();
database.onModuleDestroy();
console.log('Seed data loaded.');
