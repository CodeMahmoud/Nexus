import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkTables() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to:', connectionString);
  const pool = new Pool({ connectionString });
  
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables found:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error querying tables:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
