import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

// Log which host we're connecting to (without the password)
const redacted = connectionString.replace(/:([^@]+)@/, ':***@');
console.log(`🗄️  Database connecting to: ${redacted}`);

// For Supabase connection poolers, prepare: false is required.
// max: 1 avoids exhausting the Supabase free-tier connection limit.
export const client = postgres(connectionString, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
