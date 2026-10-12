// Fail closed: the original project's DATABASE_URL is deliberately never read.
export function databaseConfigured(env = process.env) {
  return env.WEDDING_DATABASE_ENABLED === 'true' && Boolean(env.WEDDING_DATABASE_URL);
}
export function weddingDatabaseUrl(env = process.env) {
  if (!databaseConfigured(env)) throw new Error('Database disconnected. Configure a NEW client database using WEDDING_DATABASE_URL and WEDDING_DATABASE_ENABLED=true.');
  const url = new URL(env.WEDDING_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Expected a PostgreSQL URL.');
  return url.toString();
}
