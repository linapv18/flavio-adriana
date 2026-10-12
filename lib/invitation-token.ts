// New links use 96-bit, URL-safe identifiers; existing 256-bit links remain valid.
export const isInvitationToken = (token: unknown): token is string =>
  typeof token === "string" && (/^[A-Za-z0-9_-]{16}$/.test(token) || /^[a-f0-9]{64}$/.test(token));
