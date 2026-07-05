import type { EnvRecord } from "./config";
import { loadS3Config } from "./config";
import { S3Service } from "./services/s3";
import type { S3Config } from "./types";

export type { EnvRecord } from "./config";
// === SERVICE CLASSES ===
export { S3Service } from "./services/s3";

// === MAIN FACTORY FUNCTIONS (Primary API) ===
/**
 * Create S3 service using environment variables or manual configuration
 * @param config Optional S3 configuration. If not provided, loads from environment variables
 * @param env - Optional environment record
 * @returns S3Service instance
 * @throws Error if configuration is invalid or environment variables are missing
 * @public
 *
 * @example
 * ```typescript
 * import { createS3 } from '@kumix/storage/s3';
 *
 * // Using environment variables
 * // Set: KUMIX_S3_PROVIDER=aws, KUMIX_S3_REGION=us-east-1, etc.
 * const s3FromEnv = createS3();
 * await s3FromEnv.uploadFile('test.txt', 'Hello World');
 *
 * // Using manual configuration
 * const s3Manual = createS3({
 *   provider: 'aws',
 *   region: 'us-east-1',
 *   bucket: 'my-bucket',
 *   accessKeyId: 'AKIA...',
 *   secretAccessKey: 'secret...'
 * });
 *
 * // Cloudflare R2
 * const r2 = createS3({
 *   provider: 'cloudflare-r2',
 *   region: 'auto',
 *   bucket: 'my-r2-bucket',
 *   accessKeyId: 'your-r2-key',
 *   secretAccessKey: 'your-r2-secret',
 *   endpoint: 'https://account-id.r2.cloudflarestorage.com'
 * });
 *
 * // MinIO
 * const minio = createS3({
 *   provider: 'minio',
 *   region: 'us-east-1',
 *   bucket: 'my-minio-bucket',
 *   accessKeyId: 'minioadmin',
 *   secretAccessKey: 'minioadmin',
 *   endpoint: 'http://localhost:9000',
 *   forcePathStyle: true
 * });
 * ```
 */
export function createS3(): S3Service;
export function createS3(config: S3Config): S3Service;
export function createS3(config: S3Config, env: EnvRecord): S3Service;
export function createS3(config?: S3Config, env?: EnvRecord): S3Service {
  if (config) {
    return new S3Service(config);
  }
  const envConfig = loadS3Config(env);
  return new S3Service(envConfig);
}
