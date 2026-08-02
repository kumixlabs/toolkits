/**
 * Lazy loaders for the optional AWS SDK peer dependencies.
 *
 * `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are optional peers.
 * Importing them statically would crash module load for consumers who only use
 * the Cloudinary provider (or who import the package's cross-runtime entry).
 * These loaders defer the import until an S3 operation actually runs and cache
 * the resolved modules.
 *
 * `@smithy/fetch-http-handler` is loaded so the S3 client uses `fetch()`
 * instead of Node's `http`/`https` modules, making it compatible with
 * Cloudflare Workers, Deno Deploy, Vercel Edge, and other fetch-based runtimes.
 */

type S3ClientSdk = typeof import("@aws-sdk/client-s3");
type PresignerSdk = typeof import("@aws-sdk/s3-request-presigner");
type FetchHandlerSdk = typeof import("@smithy/fetch-http-handler");

let s3SdkPromise: Promise<S3ClientSdk> | undefined;
let presignerPromise: Promise<PresignerSdk> | undefined;
let fetchHandlerPromise: Promise<FetchHandlerSdk> | undefined;

/**
 * Dynamically import `@aws-sdk/client-s3`, throwing a clear error when the
 * optional peer dependency is not installed.
 */
export async function loadS3Sdk(): Promise<S3ClientSdk> {
  if (!s3SdkPromise) {
    s3SdkPromise = import("@aws-sdk/client-s3").catch(() => {
      throw new Error(
        "@aws-sdk/client-s3 is not available. Install it to use the S3 storage provider.",
      );
    });
  }
  return s3SdkPromise;
}

/**
 * Dynamically import `@smithy/fetch-http-handler` for cross-runtime fetch transport.
 */
export async function loadFetchHandler(): Promise<FetchHandlerSdk> {
  if (!fetchHandlerPromise) {
    fetchHandlerPromise = import("@smithy/fetch-http-handler").catch(() => {
      throw new Error(
        "@smithy/fetch-http-handler is not available. Install it alongside @aws-sdk/client-s3.",
      );
    });
  }
  return fetchHandlerPromise;
}

/**
 * Dynamically import `@aws-sdk/s3-request-presigner`, throwing a clear error
 * when the optional peer dependency is not installed.
 */
export async function loadPresigner(): Promise<PresignerSdk> {
  if (!presignerPromise) {
    presignerPromise = import("@aws-sdk/s3-request-presigner").catch(() => {
      throw new Error(
        "@aws-sdk/s3-request-presigner is not available. Install it to generate presigned URLs.",
      );
    });
  }
  return presignerPromise;
}
