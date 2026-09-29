/**
 * Shared MySQL connection pool (mysql2/promise).
 *
 * Every query in the application goes through `select` or `execute`, which use
 * server-side prepared statements with bound parameters.
 */
import mysql from 'mysql2/promise';
import config from '../config/env.js';

const poolOptions = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  // The database runs in the platform timezone, so DATETIME values are read as
  // local time (see docker-compose.yml --default-time-zone).
  timezone: 'local',
  supportBigNumbers: true,
  // DECIMAL comes back as a number so latitude/longitude can be sent as JSON.
  decimalNumbers: true,
};

export const pool = mysql.createPool(poolOptions);

/** Runs a statement and returns the raw driver result. */
export const execute = async (sql, params = []) => pool.execute(sql, params);

/** Runs a SELECT and returns only the rows. */
export const select = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);

  return rows;
};

/** Runs a SELECT and returns the first row, or null. */
export const selectOne = async (sql, params = []) => {
  const rows = await select(sql, params);

  return rows.length > 0 ? rows[0] : null;
};

/** Runs an INSERT/UPDATE/DELETE and returns affectedRows and insertId. */
export const mutate = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);

  return { affectedRows: result.affectedRows, insertId: result.insertId };
};

/** Confirms the database is reachable; used at boot and by the health route. */
export const ping = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
