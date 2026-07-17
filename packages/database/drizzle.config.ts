import { defineConfig } from 'drizzle-kit';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  let currentDir = __dirname;
  // Climb up to find apps/backend/.env
  for (let i = 0; i < 5; i++) {
    const envPath = join(currentDir, 'apps/backend/.env');
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        databaseUrl = match[1].trim();
        break;
      }
    }
    currentDir = join(currentDir, '..');
  }
}

export default defineConfig({
  schema: './schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl || 'postgres://postgres:postgres@localhost:5432/postgres',
  },
});
