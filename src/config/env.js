/**
 * Loads and validates environment configuration.
 *
 * Imported first by src/server.js so process.env.TZ is applied before any Date
 * handling happens, keeping stored timestamps aligned with the database.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const read = (key, fallback = '') => {
  const value = process.env[key];

  return value === undefined || value === '' ? fallback : value;
};

const readInt = (key, fallback) => {
  const value = Number.parseInt(read(key, ''), 10);

  return Number.isFinite(value) ? value : fallback;
};

const timezone = read('APP_TIMEZONE', 'Africa/Lagos');
process.env.TZ = timezone;

const nodeEnv = read('NODE_ENV', 'development');
const rawUploadsDir = read('UPLOADS_DIR', './uploads');
const configuredSessionSecret = read('SESSION_SECRET');

if (nodeEnv === 'production' && (!configuredSessionSecret || /^(change-this|replace-with)/i.test(configuredSessionSecret))) {
  throw new Error('Set SESSION_SECRET to a unique secret before starting EWRAP in production.');
}

export const config = {
  rootDir: ROOT_DIR,
  app: {
    name: read('APP_NAME', 'EWRAP'),
    env: nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    debug: read('APP_DEBUG', '0') === '1',
    port: readInt('APP_PORT', 3000),
    url: read('APP_URL', 'http://localhost:3000'),
    timezone,
  },
  db: {
    host: read('DB_HOST', '127.0.0.1'),
    port: readInt('DB_PORT', 3306),
    user: read('DB_USER', 'ewrap_app'),
    database: read('DB_NAME', 'ewrap'),
    connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
  },
  session: {
    name: 'ewrap_session',
    secret: configuredSessionSecret || crypto.randomBytes(48).toString('base64url'),
    secure: read('SESSION_SECURE', '0') === '1',
    maxAgeMs: readInt('SESSION_MAX_AGE_HOURS', 8) * 60 * 60 * 1000,
  },
  uploads: {
    dir: path.isAbsolute(rawUploadsDir) ? rawUploadsDir : path.resolve(ROOT_DIR, rawUploadsDir),
    maxBytes: readInt('MAX_PHOTO_UPLOAD_MB', 5) * 1024 * 1024,
  },
};

/** Reports development defaults that are still in place. */
export const describeConfigWarnings = () => {
  const warnings = [];

  if (/^(change-this|replace-with)/i.test(config.session.secret)) {
    warnings.push('SESSION_SECRET is still a placeholder value.');
  }

  if (!config.session.secure && config.app.isProduction) {
    warnings.push('SESSION_SECURE=0 while NODE_ENV=production (set SESSION_SECURE=1 when serving over HTTPS).');
  }

  return warnings;
};

export default config;
