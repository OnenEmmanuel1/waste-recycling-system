import 'dotenv/config';
const url = `${process.env.APP_URL || `http://127.0.0.1:${process.env.APP_PORT || 3000}`}/health`;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const result = await response.json();
  if (!response.ok || result.status !== 'ok') throw new Error(`Health endpoint returned ${response.status}`);
  console.log(`EWRAP is healthy at ${url}`);
} catch (error) {
  console.error(`EWRAP health check failed: ${error.message}`);
  process.exitCode = 1;
}
