import config from "./wedding.json";
// Public content only. Never put passwords, database URLs or guest data here.
export const weddingConfig = config;
export const coupleNames = `${config.couple.bride} & ${config.couple.groom}`;
export const weddingTheme = Object.fromEntries(Object.entries(config.theme).map(([key, value]) => [`--${key}`, value]));
