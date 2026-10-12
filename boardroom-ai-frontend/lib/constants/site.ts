/**
 * Single source of truth for internal routes and external links,
 * referenced by both the public navbar and the dashboard sidebar so a
 * route never needs updating in two places.
 */
export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  architecture: "/architecture",
  about: "/about",
  history: "/dashboard/history",
} as const;

export const GITHUB_URL = "https://github.com/boardroom-ai/boardroom-ai";

export const SITE_NAME = "Boardroom AI";
export const SITE_TAGLINE = "Your AI Board of Directors.";
