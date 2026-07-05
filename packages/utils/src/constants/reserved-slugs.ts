/**
 * Reserved Slugs Constants
 * Provides a list of reserved slugs that cannot be used for user-generated content
 */

/**
 * Array of reserved slugs that cannot be used as workspace slugs or custom paths
 * These are reserved for system use, existing routes, or to prevent confusion/abuse
 *
 * @example
 * ```ts
 * import { RESERVED_SLUGS } from '@kumix/utils';
 *
 * // Check if a slug is reserved
 * function isSlugReserved(slug: string) {
 *   return RESERVED_SLUGS.includes(slug.toLowerCase());
 * }
 *
 * // Validate user input for custom workspace slug
 * function validateWorkspaceSlug(slug: string) {
 *   if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
 *     return {
 *       valid: false,
 *       error: 'This slug is reserved. Please choose another one.'
 *     };
 *   }
 *   return { valid: true };
 * }
 *
 * // Generate a unique slug that's not reserved
 * function generateUniqueSlug(baseName: string) {
 *   let slug = baseName.toLowerCase().replace(/\s+/g, '-');
 *
 *   if (RESERVED_SLUGS.includes(slug)) {
 *     // Append a random string or number if the slug is reserved
 *     slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
 *   }
 *
 *   return slug;
 * }
 * ```
 */
export const RESERVED_SLUGS = [
  /** 🔒 Platform reserved (root-level, system critical) */
  "va",
  "static",
  "proxy",
  "robots",
  "robots.txt",
  "_next",
  "favicon",
  "sitemap",
  "error",
  "home",
  "app",
  "www",

  /** 🧩 Marketing / public pages */
  "about",
  "blog",
  "changelog",
  "careers",
  "contact",
  "demo",
  "docs",
  "features",
  "guides",
  "help",
  "info",
  "pricing",
  "privacy",
  "resources",
  "terms",

  /** 🧭 Navigation / procedural flow */
  "new",
  "invite",
  "invitation",
  "join",
  "accept",
  "verify",
  "onboarding",

  /** 🌐 Social / external integrations */
  "discord",
  "reddit",

  /** 🧑‍💼 Auth routes */
  "auth",
  "signin",
  "signout",
  "signup",
  "forgot-password",
  "reset-password",
  "recover-account",
  "magic-link",
  "email-otp",
  "two-factor",
  "2fa",

  /** 🏢 Workspace / organization / user */
  "account",
  "accounts",
  "billing",
  "billings",
  "organization",
  "organizations",
  "workspace",
  "workspaces",
  "setting",
  "settings",
  "domains",

  /** 👥 Members / people */
  "member",
  "members",
  "people",
  "peoples",
  "user",
  "users",

  /** 🛠 API & integrations */
  "api",
  "webhooks",
  "analytics",
  "metatags",

  /** 📈 Business / revenue features */
  "campaigns",
  "links",
  "events",
  "referrals",
  "upgrade",
  "wrapped",
  "invoices",
  "programs",
  "partners",
  "payouts",
  "commissions",
  "sales",

  /** ⚙️ Admin / dashboard */
  "admin",
  "dashboard",
];
