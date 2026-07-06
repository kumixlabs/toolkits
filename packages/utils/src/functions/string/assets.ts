/**
 * Asset URL builder utilities
 * Provides helpers to construct absolute asset URLs against a configurable asset host.
 */

import { getEnv } from "../../env";

const DEFAULT_ASSET_HOST =
  getEnv("NEXT_PUBLIC_ASSETS_URL") || getEnv("VITE_ASSETS_URL") || "https://assets.kumix.io";

/**
 * Builds an absolute URL for a given asset path using the provided asset host (CDN) base.
 * Accepts relative paths (e.g., `logo/logo.png`, `/images/icon.svg`) and returns a fully-qualified URL.
 * If an absolute URL is provided as `path`, it will be returned as-is (host is ignored).
 *
 * @param path - Asset path or absolute URL to resolve
 * @param host - Optional asset host (base URL). Defaults to `https://assets.kumix.io`
 * @returns A fully-qualified asset URL string. On invalid input (empty path or
 *   malformed base), falls back to the configured asset host rather than
 *   throwing — call sites that need strict failure should validate inputs first.
 *
 * @example
 * ```ts
 * import { assetsUrl } from '@/lib/assets';
 *
 * // Default host
 * const u1 = assetsUrl('logo/logo.png');
 * // 'https://assets.kumix.io/logo/logo.png'
 *
 * // Custom host (full URL)
 * const u2 = assetsUrl('/images/icon.svg', 'https://cdn.example.com');
 * // 'https://cdn.example.com/images/icon.svg'
 *
 * // Custom host (without protocol) — will be normalized to https://
 * const u3 = assetsUrl('icons/search.svg', 'cdn.example.com');
 * // 'https://cdn.example.com/icons/search.svg'
 *
 * // Absolute path passes through (host is ignored)
 * const u4 = assetsUrl('https://other.com/a.png', 'https://cdn.example.com');
 * // 'https://other.com/a.png'
 *
 * // Edge cases — falsy path or malformed base returns the configured asset host
 * const u5 = assetsUrl('');
 * // 'https://assets.kumix.io' (the configured host)
 *
 * const u6 = assetsUrl('logo.png', '://bad-host');
 * // '://bad-host' (the supplied host — invalid, returned as-is)
 * ```
 */
export function assetsUrl(path: string, host: string = DEFAULT_ASSET_HOST): string {
  const env = getEnv("NEXT_PUBLIC_ASSETS_URL") || getEnv("VITE_ASSETS_URL");
  const BASE_HOST = env ?? host;

  if (!path || typeof path !== "string") {
    return BASE_HOST;
  }

  try {
    // Normalize BASE_HOST if given without protocol, e.g., "cdn.example.com"
    const base = /^https?:\/\//i.test(BASE_HOST) ? BASE_HOST : `https://${BASE_HOST}`;
    const url = new URL(path, base); // absolute `path` will override `base`
    return url.toString();
  } catch {
    return BASE_HOST;
  }
}

/**
 * Build a CDN URL for a country flag SVG.
 *
 * The function lowercases the given ISO country code and returns a
 * fully-qualified URL pointing to the SVG flag hosted on the Kumix
 * assets CDN.
 *
 * @param flag - ISO 3166-1 alpha-2 country code (e.g., "US", "ID", "GB")
 * @returns A URL string to the SVG flag on the CDN
 *
 * @example
 * ```ts
 * import { getFlagUrl } from "@kumix/ui/utils/flag-url";
 *
 * const urlUs = getFlagUrl("US");
 * // "https://assets.kumix.io/media/flags/us.svg"
 *
 * const urlId = getFlagUrl("id");
 * // "https://assets.kumix.io/media/flags/id.svg"
 *
 * // Can be used directly in an <img /> or <Image /> component
 * // <img src={getFlagUrl("GB")} alt="United Kingdom flag" />
 * ```
 */
export function getFlagUrl(flag: string): string {
  // Guard against null/undefined/empty/non-string inputs — without this the
  // `.toLowerCase()` call throws and a bad flag code would otherwise produce a
  // malformed ".../.svg" URL. Fall back to a deterministic placeholder.
  if (typeof flag !== "string" || !flag.trim()) {
    return `${assetsUrl("media/flags")}/unknown.svg`;
  }
  const flagCode = flag.trim().toLowerCase();

  return `${assetsUrl("media/flags")}/${flagCode}.svg`;
}
