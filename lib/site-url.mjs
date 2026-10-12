// The public address used in guest links and metadata.
// WEDDING_SITE_URL wins (e.g. a custom domain); on Vercel the project's production domain is used
// automatically; locally the config value (http://localhost:3000) applies.
export function siteUrl(configUrl, env = process.env) {
  if (env.WEDDING_SITE_URL) return env.WEDDING_SITE_URL.replace(/\/$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return configUrl.replace(/\/$/, "");
}
