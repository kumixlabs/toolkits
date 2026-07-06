/**
 * Browser metadata construction utilities
 * Provides functions for building SEO-optimized metadata for Next.js applications
 */

import { assetsUrl } from "../string/assets";

export type metadataProps = {
  baseUrl?: string;
  title?: string;
  fullTitle?: string;
  description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: disable
  icons?: Array<Record<string, any>>;
  url?: string;
  image?: string | null;
  video?: string | null;
  openGraph?: {
    type?:
      | "website"
      | "article"
      | "book"
      | "profile"
      | "music.song"
      | "music.album"
      | "music.playlist"
      | "music.radio_station"
      | "video.movie"
      | "video.episode"
      | "video.tv_show"
      | "video.other";
    locale?: string;
    name?: string;
  };
  twitter?: {
    site?: string;
    creator?: string;
  };
  canonicalUrl?: string;
  alternateLanguages?: Record<string, string>;
  noIndex?: boolean;
  noArchive?: boolean;
  noSnippet?: boolean;
  manifest?: string | URL | null;
};

/**
 * Helper to map short locale codes to Open Graph/SEO locale format
 * @param locale - Short locale code (e.g., 'en', 'id', 'ar', 'zh')
 * @returns Open Graph locale string (e.g., 'en_US', 'id_ID', 'ar_AR', 'zh_CN')
 */
export function mapLocale(locale?: string): string | undefined {
  if (!locale) return "en_US";

  const mapping: Record<string, string> = {
    af: "af_ZA", // Afrikaans - South Africa
    am: "am_ET", // Amharic - Ethiopia
    ar: "ar_AR", // Arabic - Saudi Arabia
    bn: "bn_BD", // Bengali - Bangladesh
    bg: "bg_BG", // Bulgarian - Bulgaria
    cs: "cs_CZ", // Czech - Czech Republic
    da: "da_DK", // Danish - Denmark
    de: "de_DE", // German - Germany
    el: "el_GR", // Greek - Greece
    en: "en_US", // English - United States
    en_uk: "en_GB", // English - United Kingdom
    es: "es_ES", // Spanish - Spain
    es_mx: "es_MX", // Spanish - Mexico
    fa: "fa_IR", // Persian/Farsi - Iran
    fi: "fi_FI", // Finnish - Finland
    fr: "fr_FR", // French - France
    fr_ca: "fr_CA", // French - Canada
    he: "he_IL", // Hebrew - Israel
    hi: "hi_IN", // Hindi - India
    hr: "hr_HR", // Croatian - Croatia
    hu: "hu_HU", // Hungarian - Hungary
    id: "id_ID", // Indonesian - Indonesia
    it: "it_IT", // Italian - Italy
    ja: "ja_JP", // Japanese - Japan
    ko: "ko_KR", // Korean - South Korea
    ms: "ms_MY", // Malay - Malaysia
    nl: "nl_NL", // Dutch - Netherlands
    no: "nb_NO", // Norwegian Bokmål - Norway
    pl: "pl_PL", // Polish - Poland
    pt: "pt_PT", // Portuguese - Portugal
    pt_br: "pt_BR", // Portuguese - Brazil
    ro: "ro_RO", // Romanian - Romania
    ru: "ru_RU", // Russian - Russia
    sk: "sk_SK", // Slovak - Slovakia
    sr: "sr_RS", // Serbian - Serbia
    sv: "sv_SE", // Swedish - Sweden
    sw: "sw_KE", // Swahili - Kenya
    th: "th_TH", // Thai - Thailand
    tl: "tl_PH", // Filipino/Tagalog - Philippines
    tr: "tr_TR", // Turkish - Türkiye
    uk: "uk_UA", // Ukrainian - Ukraine
    ur: "ur_PK", // Urdu - Pakistan
    vi: "vi_VN", // Vietnamese - Vietnam
    zh: "zh_CN", // Chinese (Simplified) - China
    zh_hk: "zh_HK", // Chinese (Traditional) - Hong Kong
    zh_tw: "zh_TW", // Chinese (Traditional) - Taiwan
  };

  return mapping[locale] || locale;
}

/**
 * Constructs a metadata object for Next.js pages, suitable for SEO and social sharing.
 * Supports Open Graph, Twitter cards, icons, canonical URLs, robots, manifest, and multi-language alternates.
 *
 * @param params - Metadata construction options
 * @param params.baseUrl - The base URL/domain for metadataBase (optional, e.g., 'https://kumix.io')
 * @param params.title - The base title for the page (used in Open Graph and Twitter)
 * @param params.fullTitle - The full title for the page (overrides title in the <title> tag)
 * @param params.description - Description of the page (used in meta, Open Graph, Twitter)
 * @param params.icons - Icons for the page (favicon, apple-touch-icon, mask-icon, etc.)
 * @param params.url - The canonical URL of the page (used in Open Graph, canonical)
 * @param params.image - URL of the image for social sharing (Open Graph, Twitter)
 * @param params.video - URL of the video for social sharing (Open Graph, Twitter)
 * @param params.openGraph - Open Graph options (object: type, locale, name)
 * @param params.openGraph.type - Open Graph type (e.g., 'website', 'article', etc.)
 * @param params.openGraph.locale - Open Graph locale (e.g., 'en_US', 'id_ID')
 * @param params.openGraph.name - Open Graph site name (e.g., 'Kumix')
 * @param params.twitter - Twitter card options (object: site, creator)
 * @param params.twitter.site - Twitter @username for the site
 * @param params.twitter.creator - Twitter @username for the creator
 * @param params.canonicalUrl - Alternate canonical URL (used if url is not provided)
 * @param params.alternateLanguages - Object of language codes to URLs for alternate language versions
 * @param params.noIndex - If true, sets robots meta to noindex, nofollow (default: false)
 * @param params.noArchive - If true, sets robots meta to noarchive (default: false)
 * @param params.noSnippet - If true, sets robots meta to nosnippet (default: false)
 * @param params.manifest - URL or path to the web app manifest
 * @returns Metadata object compatible with Next.js <head> and SEO best practices
 *
 * @example
 * ```ts
 * import { constructMetadata } from '@/utils/functions';
 *
 * // Basic page metadata
 * const metadata = constructMetadata({
 *   title: 'Home',
 *   fullTitle: 'Kumix - Home',
 *   description: 'Welcome to Kumix',
 *   image: assetsUrl('og-image.png'),
 *   url: '/home',
 *   openGraph: {
 *     type: 'website',
 *     locale: 'en_US',
 *     name: 'Kumix',
 *   },
 *   twitter: {
 *     site: '@kumix',
 *     creator: '@lukmanaviccena',
 *   },
 *   alternateLanguages: {
 *     en: 'https://kumix.io/en',
 *     id: 'https://kumix.io/id',
 *   },
 *   icons: [
 *     { rel: 'icon', url: '/favicon.ico' },
 *     { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5bbad5' },
 *   ],
 * });
 *
 * // Article metadata
 * const articleMetadata = constructMetadata({
 *   title: 'How to Build Better Apps',
 *   description: 'Learn the best practices for building modern web applications',
 *   image: assetsUrl('articles/build-better-apps.pn'),
 *   url: '/blog/build-better-apps',
 *   openGraph: {
 *     type: 'article',
 *     locale: 'en_US',
 *     name: 'Kumix Blog',
 *   },
 * });
 *
 * // Product page metadata
 * const productMetadata = constructMetadata({
 *   title: 'Premium Plan',
 *   description: 'Unlock advanced features with our premium plan',
 *   image: assetsUrl('products/premium.png'),
 *   url: '/pricing/premium',
 *   noIndex: false,
 *   manifest: '/manifest.json',
 * });
 * ```
 */
export function constructMetadata({
  baseUrl,
  title,
  fullTitle,
  description,
  icons = [
    {
      rel: "apple-touch-icon",
      sizes: "32x32",
      url: assetsUrl("favicon/apple-touch-icon.png"),
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: assetsUrl("favicon/favicon-32x32.png"),
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: assetsUrl("favicon/favicon-16x16.png"),
    },
  ],
  image,
  video,
  url,
  openGraph = {
    type: "website",
    locale: "en_US",
  },
  twitter = {},
  canonicalUrl,
  alternateLanguages,
  noIndex = false,
  noArchive = false,
  noSnippet = false,
  manifest,
  // biome-ignore lint/suspicious/noExplicitAny: disable
}: metadataProps): Record<string, any> {
  // Build metadataBase defensively: a malformed baseUrl (common in dev, e.g.
  // NEXT_PUBLIC_SITE_URL="localhost:3000" without protocol) used to throw and
  // 500 the page during Next.js metadata construction. Fall back to undefined.
  let metadataBase: URL | undefined;
  if (baseUrl) {
    try {
      metadataBase = new URL(baseUrl);
    } catch {
      metadataBase = undefined;
    }
  }

  return {
    metadataBase,
    title: fullTitle || title,
    description,
    icons,
    openGraph: {
      title,
      description,
      type: openGraph.type ?? "website",
      locale: mapLocale(openGraph.locale),
      ...(openGraph.name && {
        siteName: openGraph.name,
      }),
      url,
      ...(image && {
        images: image,
      }),
      ...(video && {
        videos: video,
      }),
    },
    twitter: {
      title,
      description,
      ...(image && {
        card: "summary_large_image",
        images: [image],
      }),
      ...(video && {
        player: video,
      }),
      ...(twitter.site && {
        site: twitter.site,
      }),
      ...(twitter.creator && {
        creator: twitter.creator,
      }),
    },
    ...((url || canonicalUrl || alternateLanguages) && {
      alternates: {
        ...(url || canonicalUrl ? { canonical: url || canonicalUrl } : {}),
        ...(alternateLanguages ? { languages: alternateLanguages } : {}),
      },
    }),
    ...((noIndex || noArchive || noSnippet) && {
      robots: {
        ...(noIndex ? { index: false, follow: false } : {}),
        ...(noArchive ? { noarchive: true } : {}),
        ...(noSnippet ? { nosnippet: true } : {}),
      },
    }),
    ...(manifest && {
      manifest,
    }),
    creator: "lukmanaviccena",
  };
}
