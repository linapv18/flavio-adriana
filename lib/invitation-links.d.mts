export function hashToken(token: string): string;
export function shortTokenFromHash(tokenHash: string): string;
export function tokenLookup(token: string): { short: boolean; lookup: string };
export function invitationUrl(siteUrl: string, tokenHash: string): string;
