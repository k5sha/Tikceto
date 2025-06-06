export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: import.meta.env.VITE_APP_NAME || "Ticketo",
  server_api: import.meta.env.VITE_API_URL || "https://api.tikceto.k5sha.xyz/v1",
};
