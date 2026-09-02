import 'dotenv/config';
import { drizzle } from 'drizzle-orm/singlestore/driver';
import PG from 'pg';

if(!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not defined');
}

export const pool = new PG.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);