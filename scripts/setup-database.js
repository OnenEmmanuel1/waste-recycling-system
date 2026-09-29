import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'ewrap_app',
  database: process.env.DB_NAME || 'ewrap', charset: 'utf8mb4', multipleStatements: true,
});
try {
  if (!process.argv.includes('--seed-only')) {
    await connection.query(await fs.readFile(path.join(root, 'sql/schema.sql'), 'utf8'));
    console.log('Database schema applied.');
  }
  const [existingSeed] = await connection.execute('SELECT userId FROM users WHERE email=? LIMIT 1', ['admin@ewrap.local']);
  if (existingSeed.length) {
    console.log('Demo data already exists; no changes made.');
  } else {
    await connection.query(await fs.readFile(path.join(root, 'sql/seed.sql'), 'utf8'));
    console.log('Demo records seeded.');
  }
} finally { await connection.end(); }
