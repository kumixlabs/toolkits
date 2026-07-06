/**
 * Utility function for iframe embedding validation
 * Checks if a URL can be embedded in an iframe based on security headers
 */

/**
 * Determines if a URL can be displayed in an iframe by checking security headers.
 * Examines Content-Security-Policy `frame-ancestors` and `X-Frame-Options` headers.
 *
 * A URL is considered embeddable only when:
 * - `frame-ancestors` is absent OR explicitly allows `*` / `self` (same origin) /
 *   a wildcard/origin that matches `requestDomain`, AND
 * - `X-Frame-Options` is not `DENY` or `SAMEORIGIN` (when origin differs).
 *
 * @param options - The options for the check
 * @param options.url - The URL to check for iframe embedding capability
 * @param options.requestDomain - The origin that will be embedding the iframe
 *   (e.g. `https://myapp.com`). Compared against CSP source expressions.
 * @returns A Promise that resolves to true if the URL can be embedded, false otherwise.
 *
 * @example
 * ```ts
 * import { isIframeable } from '@/utils/functions';
 *
 * const canEmbed = await isIframeable({
 *   url: 'https://example.com',
 *   requestDomain: 'https://myapp.com'
 * });
 * ```
 */
export const isIframeable = async ({
  url,
  requestDomain,
}: {
  url: string;
  requestDomain: string;
}): Promise<boolean> => {
  const res = await fetch(url);

  const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, "").toLowerCase();
  const requestedOrigin = normalizeOrigin(requestDomain);

  // 1. Content-Security-Policy: frame-ancestors (CSP Level 2).
  //    If present, it is the authoritative source for embeddability — it OVERRIDES
  //    X-Frame-Options per the CSP spec.
  const cspHeader = res.headers.get("content-security-policy");
  if (cspHeader) {
    const frameAncestorsMatch = cspHeader.match(/frame-ancestors\s+([\s\S]+?)(?=;|$)/i);
    if (frameAncestorsMatch) {
      const sources = frameAncestorsMatch[1].trim().split(/\s+/).filter(Boolean);

      const isAllowed = sources.some((source) => {
        const s = source.toLowerCase();
        if (s === "'none'") return false;
        if (s === "*" || s === "https:*" || s === "http:*") return true;
        if (s === "'self'") {
          // 'self' means same origin as the framed document, not the embedder.
          // We can't reliably know the embedder matches without comparing to the
          // response URL's origin, so treat conservatively as a match only when
          // the request domain matches the target URL origin.
          try {
            const targetOrigin = normalizeOrigin(new URL(res.url).origin);
            return targetOrigin === requestedOrigin;
          } catch {
            return false;
          }
        }
        // Wildcard scheme/host like https://*.example.com
        if (s.includes("*")) {
          const pattern = s.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
          return new RegExp(`^${pattern}$`).test(requestedOrigin);
        }
        return normalizeOrigin(s) === requestedOrigin;
      });

      // frame-ancestors is authoritative: if it doesn't list us, we are blocked,
      // regardless of X-Frame-Options.
      return isAllowed;
    }
  }

  // 2. X-Frame-Options (legacy, CVE-prone). Only consulted when no frame-ancestors.
  const xFrameOptions = res.headers.get("X-Frame-Options");
  if (xFrameOptions) {
    const value = xFrameOptions.trim().toUpperCase();
    if (value === "DENY") {
      return false;
    }
    if (value === "SAMEORIGIN") {
      try {
        return normalizeOrigin(new URL(res.url).origin) === requestedOrigin;
      } catch {
        return false;
      }
    }
    // "ALLOW-FROM" is deprecated and unsupported; treat as not embeddable.
    if (value.startsWith("ALLOW-FROM")) {
      return false;
    }
  }

  return true;
};
