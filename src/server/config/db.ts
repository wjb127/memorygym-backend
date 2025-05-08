import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.server' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params)
}; 