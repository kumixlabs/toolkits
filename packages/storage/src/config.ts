/**
 * Storage configuration from environment variables
 * Provides automatic configuration loading from environment variables
 */

import type { CloudinaryConfig, S3Config, StorageConfig } from "./types";

/**
 * Cross-runtime environment record.
 * Pass `process.env` on Node.js, `ctx.env` on Cloudflare Workers,
 * `Deno.env.toObject()` on Deno, or a plain object in the browser.
 */
export type EnvRecord = Record<string, string | undefined>;

function getDefaultEnv(): EnvRecord | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env as EnvRecord;
  }
  return undefined;
}

function resolveEnv(env?: EnvRecord): EnvRecord | undefined {
  return env ?? getDefaultEnv();
}

/**
 * Environment variable names for storage configuration
 * @public
 *
 * @example
 * ```typescript
 * import { ENV_VARS } from '@kumix/storage';
 *
 * // Check if specific env vars are set
 * console.log(process.env[ENV_VARS.KUMIX_S3_BUCKET]);
 * console.log(process.env[ENV_VARS.KUMIX_CLOUDINARY_CLOUD_NAME]);
 * ```
 */
export const ENV_VARS = {
  // S3 Configuration
  KUMIX_S3_PROVIDER: "KUMIX_S3_PROVIDER",
  KUMIX_S3_REGION: "KUMIX_S3_REGION",
  KUMIX_S3_BUCKET: "KUMIX_S3_BUCKET",
  KUMIX_S3_ACCESS_KEY_ID: "KUMIX_S3_ACCESS_KEY_ID",
  KUMIX_S3_SECRET_ACCESS_KEY: "KUMIX_S3_SECRET_ACCESS_KEY",
  KUMIX_S3_ENDPOINT: "KUMIX_S3_ENDPOINT",
  KUMIX_S3_FORCE_PATH_STYLE: "KUMIX_S3_FORCE_PATH_STYLE",
  KUMIX_S3_PUBLIC_URL: "KUMIX_S3_PUBLIC_URL",

  // Cloudinary Configuration
  KUMIX_CLOUDINARY_CLOUD_NAME: "KUMIX_CLOUDINARY_CLOUD_NAME",
  KUMIX_CLOUDINARY_API_KEY: "KUMIX_CLOUDINARY_API_KEY",
  KUMIX_CLOUDINARY_API_SECRET: "KUMIX_CLOUDINARY_API_SECRET",
  KUMIX_CLOUDINARY_SECURE: "KUMIX_CLOUDINARY_SECURE",
  KUMIX_CLOUDINARY_FOLDER: "KUMIX_CLOUDINARY_FOLDER",
} as const;

/**
 * Get environment variable value
 * @param key - Environment variable name
 * @param env - Optional environment record
 * @internal
 */
function getEnvVar(key: string, env?: EnvRecord): string | undefined {
  const e = resolveEnv(env);
  if (!e) return undefined;
  return e[key];
}

/**
 * Get required environment variable value
 * @param key - Environment variable name
 * @param env - Optional environment record
 * @internal
 */
function getRequiredEnvVar(key: string, env?: EnvRecord): string {
  const value = getEnvVar(key, env);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get boolean environment variable value
 * @param key - Environment variable name
 * @param defaultValue - Default boolean value if not set
 * @param env - Optional environment record
 * @internal
 */
function getBooleanEnvVar(key: string, defaultValue = false, env?: EnvRecord): boolean {
  const value = getEnvVar(key, env);
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Load S3 configuration from environment variables
 * @param env - Optional environment record
 * @returns S3 configuration object
 * @throws Error if required environment variables are missing
 * @public
 *
 * @example
 * ```typescript
 * import { loadS3Config } from '@kumix/storage';
 *
 * // Set environment variables first:
 * // KUMIX_S3_PROVIDER=aws
 * // KUMIX_S3_REGION=us-east-1
 * // KUMIX_S3_BUCKET=my-bucket
 * // KUMIX_S3_ACCESS_KEY_ID=AKIA...
 * // KUMIX_S3_SECRET_ACCESS_KEY=secret...
 *
 * try {
 *   const config = loadS3Config();
 *   console.log(config);
 *   // Returns: {
 *   //   provider: 'aws',
 *   //   region: 'us-east-1',
 *   //   bucket: 'my-bucket',
 *   //   accessKeyId: 'AKIA...',
 *   //   secretAccessKey: 'secret...'
 *   // }
 * } catch (error) {
 *   console.error('Missing S3 configuration:', error.message);
 * }
 * ```
 */
export function loadS3Config(env?: EnvRecord): S3Config {
  const provider = getRequiredEnvVar(ENV_VARS.KUMIX_S3_PROVIDER, env) as S3Config["provider"];

  // Validate provider
  const validProviders: S3Config["provider"][] = [
    "aws",
    "cloudflare-r2",
    "minio",
    "digitalocean",
    "supabase",
    "custom",
  ];
  if (!validProviders.includes(provider)) {
    throw new Error(
      `Invalid S3 provider: ${provider}. Must be one of: ${validProviders.join(", ")}`,
    );
  }

  return {
    provider,
    region: getRequiredEnvVar(ENV_VARS.KUMIX_S3_REGION, env),
    bucket: getRequiredEnvVar(ENV_VARS.KUMIX_S3_BUCKET, env),
    accessKeyId: getRequiredEnvVar(ENV_VARS.KUMIX_S3_ACCESS_KEY_ID, env),
    secretAccessKey: getRequiredEnvVar(ENV_VARS.KUMIX_S3_SECRET_ACCESS_KEY, env),
    endpoint: getEnvVar(ENV_VARS.KUMIX_S3_ENDPOINT, env),
    forcePathStyle: getBooleanEnvVar(ENV_VARS.KUMIX_S3_FORCE_PATH_STYLE, false, env),
    publicUrl: getEnvVar(ENV_VARS.KUMIX_S3_PUBLIC_URL, env),
  };
}

/**
 * Load Cloudinary configuration from environment variables
 * @param env - Optional environment record
 * @returns Cloudinary configuration object
 * @throws Error if required environment variables are missing
 * @public
 *
 * @example
 * ```typescript
 * import { loadCloudinaryConfig } from '@kumix/storage';
 *
 * // Set environment variables first:
 * // KUMIX_CLOUDINARY_CLOUD_NAME=my-cloud
 * // KUMIX_CLOUDINARY_API_KEY=123456789
 * // KUMIX_CLOUDINARY_API_SECRET=secret...
 * // KUMIX_CLOUDINARY_SECURE=true (optional)
 * // KUMIX_CLOUDINARY_FOLDER=uploads (optional)
 *
 * try {
 *   const config = loadCloudinaryConfig();
 *   console.log(config);
 *   // Returns: {
 *   //   provider: 'cloudinary',
 *   //   cloudName: 'my-cloud',
 *   //   apiKey: '123456789',
 *   //   apiSecret: 'secret...',
 *   //   secure: true,
 *   //   folder: 'uploads'
 *   // }
 * } catch (error) {
 *   console.error('Missing Cloudinary configuration:', error.message);
 * }
 * ```
 */
export function loadCloudinaryConfig(env?: EnvRecord): CloudinaryConfig {
  return {
    provider: "cloudinary",
    cloudName: getRequiredEnvVar(ENV_VARS.KUMIX_CLOUDINARY_CLOUD_NAME, env),
    apiKey: getRequiredEnvVar(ENV_VARS.KUMIX_CLOUDINARY_API_KEY, env),
    apiSecret: getRequiredEnvVar(ENV_VARS.KUMIX_CLOUDINARY_API_SECRET, env),
    secure: getBooleanEnvVar(ENV_VARS.KUMIX_CLOUDINARY_SECURE, true, env),
    folder: getEnvVar(ENV_VARS.KUMIX_CLOUDINARY_FOLDER, env),
  };
}

/**
 * Auto-detect and load storage configuration from environment variables
 * Determines the provider based on available environment variables
 * @param env - Optional environment record
 * @returns Storage configuration object (S3 or Cloudinary)
 * @throws Error if no valid configuration is found
 * @public
 *
 * @example
 * ```typescript
 * import { loadStorageConfig } from '@kumix/storage';
 *
 * // Auto-detection based on available env vars
 * try {
 *   const config = loadStorageConfig();
 *
 *   if (config.provider === 'cloudinary') {
 *     console.log('Using Cloudinary:', config.cloudName);
 *   } else {
 *     console.log('Using S3:', config.provider, config.bucket);
 *   }
 * } catch (error) {
 *   console.error('No storage configuration found:', error.message);
 * }
 *
 * // Explicit provider (set KUMIX_S3_PROVIDER=cloudinary)
 * // Will load Cloudinary config even if S3 vars are also present
 * ```
 */
export function loadStorageConfig(env?: EnvRecord): StorageConfig {
  const provider = getEnvVar(ENV_VARS.KUMIX_S3_PROVIDER, env);

  // If provider is explicitly set, use it
  if (provider) {
    if (provider === "cloudinary") {
      return loadCloudinaryConfig(env);
    }
    return loadS3Config(env);
  }

  // Auto-detect based on available environment variables
  const hasCloudinaryVars =
    getEnvVar(ENV_VARS.KUMIX_CLOUDINARY_CLOUD_NAME, env) &&
    getEnvVar(ENV_VARS.KUMIX_CLOUDINARY_API_KEY, env) &&
    getEnvVar(ENV_VARS.KUMIX_CLOUDINARY_API_SECRET, env);

  const hasS3Vars =
    getEnvVar(ENV_VARS.KUMIX_S3_BUCKET, env) &&
    getEnvVar(ENV_VARS.KUMIX_S3_ACCESS_KEY_ID, env) &&
    getEnvVar(ENV_VARS.KUMIX_S3_SECRET_ACCESS_KEY, env);

  if (hasCloudinaryVars) {
    return loadCloudinaryConfig(env);
  }
  if (hasS3Vars) {
    // Default to AWS if no provider specified
    const config = loadS3Config(env);
    if (!config.provider) {
      config.provider = "aws";
    }
    return config;
  }

  throw new Error(
    "No storage configuration found. Please set either:\n" +
      "- S3: KUMIX_S3_PROVIDER, KUMIX_S3_REGION, KUMIX_S3_BUCKET, KUMIX_S3_ACCESS_KEY_ID, KUMIX_S3_SECRET_ACCESS_KEY\n" +
      "- Cloudinary: KUMIX_CLOUDINARY_CLOUD_NAME, KUMIX_CLOUDINARY_API_KEY, KUMIX_CLOUDINARY_API_SECRET",
  );
}

/**
 * Check if storage configuration is available in environment variables
 * @param env - Optional environment record
 * @returns True if valid storage configuration is found
 * @public
 *
 * @example
 * ```typescript
 * import { hasStorageConfig, loadStorageConfig } from '@kumix/storage';
 *
 * if (hasStorageConfig()) {
 *   const config = loadStorageConfig();
 *   console.log('Storage configured:', config.provider);
 * } else {
 *   console.log('Please set storage environment variables');
 * }
 *
 * // Use in conditional initialization
 * const storage = hasStorageConfig() ? createStorage() : null;
 * ```
 */
export function hasStorageConfig(env?: EnvRecord): boolean {
  try {
    loadStorageConfig(env);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if storage configuration is available in environment variables
 * @param env - Optional environment record
 * @returns True if either S3 or Cloudinary configuration is available
 * @public
 *
 * @example
 * ```typescript
 * import { isStorageConfigured, createS3, createCloudinary } from '@kumix/storage';
 *
 * if (isStorageConfigured()) {
 *   // Choose your preferred provider
 *   const s3 = createS3();
 *   // OR
 *   const cloudinary = createCloudinary();
 *
 *   await s3.uploadFile('test.txt', 'Hello World');
 * } else {
 *   console.log('Storage not configured. Please set environment variables.');
 * }
 *
 * // Use in conditional initialization
 * const storage = isStorageConfigured() ? createS3() : null;
 * if (storage) {
 *   await storage.uploadFile('file.txt', content);
 * }
 * ```
 */
export function isStorageConfigured(env?: EnvRecord): boolean {
  return hasStorageConfig(env);
}

/**
 * Get storage provider name from environment variables without loading full config
 * @param env - Optional environment record
 * @returns Provider name or undefined if not configured
 * @public
 *
 * @example
 * ```typescript
 * import { getStorageProvider } from '@kumix/storage';
 *
 * const provider = getStorageProvider();
 *
 * switch (provider) {
 *   case 'aws':
 *     console.log('Using AWS S3');
 *     break;
 *   case 'cloudinary':
 *     console.log('Using Cloudinary');
 *     break;
 *   case 'cloudflare-r2':
 *     console.log('Using Cloudflare R2');
 *     break;
 *   default:
 *     console.log('No storage provider configured');
 * }
 *
 * // Quick check without throwing errors
 * if (getStorageProvider()) {
 *   // Storage is configured
 * }
 * ```
 */
export function getStorageProvider(env?: EnvRecord): string | undefined {
  const provider = getEnvVar(ENV_VARS.KUMIX_S3_PROVIDER, env);
  if (provider) return provider;

  // Auto-detect
  const hasCloudinaryVars = getEnvVar(ENV_VARS.KUMIX_CLOUDINARY_CLOUD_NAME, env);
  const hasS3Vars = getEnvVar(ENV_VARS.KUMIX_S3_BUCKET, env);

  if (hasCloudinaryVars) return "cloudinary";
  if (hasS3Vars) return "aws"; // Default S3 provider

  return undefined;
}

/**
 * Validate if all required environment variables are set for S3
 * @param env - Optional environment record
 * @returns Validation result with missing variables
 * @public
 *
 * @example
 * ```typescript
 * import { validateS3EnvVars } from '@kumix/storage';
 *
 * const validation = validateS3EnvVars();
 *
 * if (validation.valid) {
 *   console.log('S3 configuration is complete');
 * } else {
 *   console.log('Missing S3 variables:', validation.missing);
 *   // Returns: ["KUMIX_S3_REGION", "KUMIX_S3_BUCKET"]
 * }
 * ```
 */
export function validateS3EnvVars(env?: EnvRecord): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    ENV_VARS.KUMIX_S3_PROVIDER,
    ENV_VARS.KUMIX_S3_REGION,
    ENV_VARS.KUMIX_S3_BUCKET,
    ENV_VARS.KUMIX_S3_ACCESS_KEY_ID,
    ENV_VARS.KUMIX_S3_SECRET_ACCESS_KEY,
  ];

  const missing = required.filter((key) => !getEnvVar(key, env));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate if all required environment variables are set for Cloudinary
 * @param env - Optional environment record
 * @returns Validation result with missing variables
 * @public
 *
 * @example
 * ```typescript
 * import { validateCloudinaryEnvVars } from '@kumix/storage';
 *
 * const validation = validateCloudinaryEnvVars();
 *
 * if (validation.valid) {
 *   console.log('Cloudinary configuration is complete');
 * } else {
 *   console.log('Missing Cloudinary variables:', validation.missing);
 *   // Returns: ["KUMIX_CLOUDINARY_API_KEY"]
 * }
 * ```
 */
export function validateCloudinaryEnvVars(env?: EnvRecord): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    ENV_VARS.KUMIX_CLOUDINARY_CLOUD_NAME,
    ENV_VARS.KUMIX_CLOUDINARY_API_KEY,
    ENV_VARS.KUMIX_CLOUDINARY_API_SECRET,
  ];

  const missing = required.filter((key) => !getEnvVar(key, env));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get all available environment variables for debugging
 * @param env - Optional environment record
 * @returns Object containing all storage-related env vars
 * @public
 *
 * @example
 * ```typescript
 * import { getStorageEnvVars } from '@kumix/storage';
 *
 * const envVars = getStorageEnvVars();
 * console.log('Storage environment variables:', envVars);
 * // Returns: {
 * //   KUMIX_S3_PROVIDER: 'aws',
 * //   KUMIX_S3_REGION: 'us-east-1',
 * //   KUMIX_S3_BUCKET: 'my-bucket',
 * //   // ... other set variables (secrets are masked)
 * // }
 * ```
 */
export function getStorageEnvVars(env?: EnvRecord): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  Object.values(ENV_VARS).forEach((key) => {
    const value = getEnvVar(key, env);
    if (value) {
      // Mask sensitive values
      if (key.includes("SECRET") || key.includes("API_SECRET")) {
        result[key] = `${value.substring(0, 4)}***`;
      } else {
        result[key] = value;
      }
    }
  });

  return result;
}
