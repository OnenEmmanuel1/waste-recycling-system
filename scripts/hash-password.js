#!/usr/bin/env node
/**
 * Prints a bcrypt hash for a password, for use when provisioning accounts
 * directly in SQL (see README "Provisioning administrators").
 *
 * Usage: node scripts/hash-password.js "your-password"
 */
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;
const password = process.argv[2] ?? '';

if (password.length < 10) {
  console.error('Provide a password of at least 10 characters.');
  console.error('Usage: node scripts/hash-password.js "your-password"');
  process.exitCode = 1;
} else {
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  console.log(hash);
  console.log(`verified: ${bcrypt.compareSync(password, hash)}`);
}
