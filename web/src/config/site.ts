export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: import.meta.env.VITE_APP_NAME || "Ticketo",
  server_api: import.meta.env.VITE_API_URL || "http://185.126.115.87/api/v1",
};
