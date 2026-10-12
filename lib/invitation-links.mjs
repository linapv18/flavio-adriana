import { createHash } from "node:crypto";
// Short guest links are the first 96 bits of the stored SHA-256 token hash; long links are the original 256-bit token.
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export const shortTokenFromHash = (tokenHash) => Buffer.from(tokenHash.slice(0, 24), "hex").toString("base64url");
export const tokenLookup = (token) => token.length === 16
  ? { short: true, lookup: Buffer.from(token, "base64url").toString("hex") }
  : { short: false, lookup: hashToken(token) };
export const invitationUrl = (siteUrl, tokenHash) => `${siteUrl.replace(/\/$/, "")}/?token=${shortTokenFromHash(tokenHash)}`;
