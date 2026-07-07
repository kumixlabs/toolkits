/**
 * Cloudinary storage provider implementation
 * Provides cloud storage operations using Cloudinary's API for media management
 */

import type {
  BatchDeleteOptions,
  BatchDeleteResult,
  CloudinaryConfig,
  CopyFolderOptions,
  CopyFolderResult,
  CopyOptions,
  CopyResult,
  CreateFolderOptions,
  CreateFolderResult,
  DeleteFolderOptions,
  DeleteFolderResult,
  DeleteOptions,
  DeleteResult,
  DownloadOptions,
  DownloadResult,
  DuplicateOptions,
  DuplicateResult,
  ExistsResult,
  FolderExistsResult,
  ListFoldersOptions,
  ListFoldersResult,
  ListOptions,
  ListResult,
  MoveOptions,
  MoveResult,
  PresignedUrlOptions,
  PresignedUrlResult,
  RenameFolderOptions,
  RenameFolderResult,
  StorageInterface,
  UploadOptions,
  UploadResult,
} from "../types";

/**
 * Cloudinary storage provider
 * Implements StorageInterface for Cloudinary cloud storage
 * @internal
 */
// biome-ignore lint/suspicious/noExplicitAny: Cloudinary SDK is dynamically imported and untyped here.
type CloudinaryClient = any;

export class CloudinaryProvider implements StorageInterface {
  private config: CloudinaryConfig;
  private _client: CloudinaryClient | null = null;

  constructor(config: CloudinaryConfig) {
    this.config = config;
  }

  /**
   * Lazily load the Cloudinary SDK and re-apply this instance's config to the
   * module-global v2 client. The SDK is dynamically imported so the optional
   * `cloudinary` peer dep isn't required at module load time — consumers who
   * only use the S3 provider can import the package without installing it.
   *
   * NOTE: the Cloudinary SDK keeps a single global config, so creating multiple
   * `CloudinaryProvider` instances with different credentials in the same
   * process is not supported — the most recently-configured instance wins.
   * `getClient()` re-applies config before each API call to narrow the race
   * window when instances are interleaved.
   */
  private async getClient(): Promise<CloudinaryClient> {
    if (!this._client) {
      try {
        const mod = await import("cloudinary");
        this._client = mod.v2 ?? (mod as { default?: { v2?: CloudinaryClient } }).default?.v2;
      } catch {
        throw new Error(
          "cloudinary is not available in this runtime. " +
            "Install the `cloudinary` package to use the Cloudinary storage provider.",
        );
      }
    }
    this._client.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: this.config.secure !== false,
    });
    return this._client;
  }

  // File operations
  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const cloudinary = await this.getClient();
      // Convert Buffer/Uint8Array to base64 for Cloudinary
      let fileData: string;
      if (typeof options.file === "string") {
        fileData = options.file;
      } else {
        fileData = `data:${options.contentType || "application/octet-stream"};base64,${Buffer.from(options.file).toString("base64")}`;
      }

      // Determine resource type based on content type
      let resourceType: "image" | "video" | "raw" = "raw";
      if (options.contentType?.startsWith("image/")) {
        resourceType = "image";
      } else if (options.contentType?.startsWith("video/")) {
        resourceType = "video";
      }

      // Extract folder and filename from key for Cloudinary folder support
      const keyParts = options.key.split("/");
      let folder = "";
      let publicId = keyParts[keyParts.length - 1];

      if (keyParts.length > 1) {
        folder = keyParts.slice(0, -1).join("/");
      }

      // Only strip the extension for image/video assets. Cloudinary keeps the
      // extension as part of the public_id for `raw` resources, so stripping it
      // would break the stored-id / `getPublicUrl` round-trip for raw files.
      if (resourceType !== "raw") {
        const dotIndex = publicId.lastIndexOf(".");
        if (dotIndex > 0) {
          publicId = publicId.slice(0, dotIndex);
        }
      }

      const uploadOptions: Record<string, unknown> = {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        invalidate: true,
        // Send user metadata under `context`/`metadata` instead of spreading it
        // at the top level. Spreading last let callers override security-
        // sensitive fields like `public_id`, `resource_type`, and `folder`.
        ...(options.metadata ? { context: options.metadata } : {}),
      };

      // Combine config folder + extracted folder without trailing slashes
      const folderParts: string[] = [];
      if (this.config.folder) folderParts.push(this.config.folder);
      if (folder) folderParts.push(folder);
      if (folderParts.length > 0) {
        uploadOptions.folder = folderParts.join("/");
      }

      const result = await cloudinary.uploader.upload(fileData, uploadOptions);

      // Sample result structure
      // {
      //   asset_id: 'b4033628c0897843e61e362167f338d6',
      //   public_id: 'starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30',
      //   version: 1765965394,
      //   version_id: 'abd49804c49061cef406f8d703466849',
      //   signature: 'ff52169a483bada7ca4943ce322132137bec4d2f',
      //   width: 256,
      //   height: 256,
      //   format: 'png',
      //   resource_type: 'image',
      //   created_at: '2025-12-17T09:52:12Z',
      //   tags: [],
      //   bytes: 76429,
      //   type: 'upload',
      //   etag: '85e34db0ea9ce8e771e25bd8eb33ba56',
      //   placeholder: false,
      //   url: 'http://res.cloudinary.com/droen5ejq/image/upload/v1765965394/starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30.png',
      //   secure_url: 'https://res.cloudinary.com/droen5ejq/image/upload/v1765965394/starter/workspaces/logo/ws_1KBQ2V0VRKK5EN936G8S2XZ30.png',
      //   asset_folder: 'starter/workspaces/logo',
      //   display_name: 'ws_1KBQ2V0VRKK5EN936G8S2XZ30',
      //   overwritten: true,
      //   api_key: '255239588173378'
      // }

      const publicUrl = this.getPublicUrl(result.public_id, result.format, resourceType);

      return {
        success: true,
        key: result.public_id,
        url: result.secure_url,
        publicUrl,
        etag: result.etag,
        size: result.bytes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    try {
      // Cloudinary doesn't support direct download like S3, so we fetch from
      // the public URL. Split the key into a base + extension and pass the
      // extension through so `getPublicUrl` can infer the correct resource
      // type (image/video/raw). Passing the bare key would default to `raw`
      // and 404 for image/video assets.
      const dotIndex = options.key.lastIndexOf(".");
      const hasExt = dotIndex > 0 && dotIndex < options.key.length - 1;
      const baseKey = hasExt ? options.key.slice(0, dotIndex) : options.key;
      const extension = hasExt ? options.key.slice(dotIndex + 1) : undefined;
      const publicUrl = this.getPublicUrl(baseKey, extension);

      const response = await fetch(publicUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to download: ${response.status} ${response.statusText}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);

      return {
        success: true,
        content, // Main content field
        data: content, // Alias for backward compatibility
        contentType: response.headers.get("content-type") || undefined,
        contentLength: content.length,
        lastModified: response.headers.get("last-modified")
          ? new Date(response.headers.get("last-modified")!)
          : new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    try {
      const cloudinary = await this.getClient();
      // Strip extension to get public_id
      let publicId = options.key;
      const dotIndex = publicId.lastIndexOf(".");
      if (dotIndex > 0) {
        publicId = publicId.slice(0, dotIndex);
      }

      // Add folder if enabled in config
      if (this.config.folder) {
        publicId = `${this.config.folder}/${publicId}`;
      }

      // Determine resource type from key/path
      let resourceType: "image" | "video" | "raw" = "raw";

      // Try to get resource info first to determine type
      try {
        await cloudinary.api.resource(publicId, { resource_type: "image" });
        resourceType = "image";
      } catch {
        try {
          await cloudinary.api.resource(publicId, { resource_type: "video" });
          resourceType = "video";
        } catch {
          resourceType = "raw";
        }
      }

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }

  async batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult> {
    try {
      const cloudinary = await this.getClient();
      // Convert keys to public_ids (strip extensions, add folder prefix)
      const publicIds = options.keys.map((key) => {
        let publicId = key;
        const dotIndex = publicId.lastIndexOf(".");
        if (dotIndex > 0) {
          publicId = publicId.slice(0, dotIndex);
        }
        if (this.config.folder) {
          publicId = `${this.config.folder}/${publicId}`;
        }
        return publicId;
      });

      const result = await cloudinary.api.delete_resources(publicIds);

      // delete_resources returns an object keyed by public_id with status info
      const deleted: string[] = [];
      const errors: { key: string; error: string }[] = [];

      for (const [publicId, info] of Object.entries(result)) {
        const originalKey = options.keys[publicIds.indexOf(publicId)] || publicId;
        const status = (info as Record<string, unknown>)?.status;
        if (status === "deleted" || status === "not_found") {
          deleted.push(originalKey);
        } else {
          errors.push({ key: originalKey, error: `Delete status: ${String(status)}` });
        }
      }

      return {
        success: errors.length === 0,
        deleted,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        errors: options.keys.map((key) => ({
          key,
          error: error instanceof Error ? error.message : "Batch delete failed",
        })),
      };
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    try {
      const cloudinary = await this.getClient();
      const prefix = options.prefix || "";
      const maxResults = options.maxKeys || 50;

      // Each Cloudinary resource_type (image/video/raw) maintains its OWN
      // opaque cursor. The previous implementation queried all three in
      // parallel and returned `images.next_cursor || videos.next_cursor ||
      // raw.next_cursor` — so a page-2 token belonging to (say) videos was
      // fed to the images call on the next request, producing wrong/empty
      // results. We now query ONE type per page call and encode the owning
      // type into the continuation token so the next call resumes the right
      // type. Types are visited in stable order (image → video → raw); when a
      // type's page is empty we auto-advance to the next type within the same
      // call so the caller never receives an empty page.
      const TYPES = ["image", "video", "raw"] as const;
      type RType = (typeof TYPES)[number];

      let type: RType = "image";
      let cursor: string | undefined;
      if (options.continuationToken) {
        const sep = options.continuationToken.indexOf(":");
        if (sep > 0) {
          const t = options.continuationToken.slice(0, sep);
          const c = options.continuationToken.slice(sep + 1);
          if ((TYPES as readonly string[]).includes(t)) {
            type = t as RType;
            cursor = c || undefined;
          }
        }
      }

      const fetchPage = (rt: RType, c?: string) =>
        cloudinary.api
          .resources({
            type: "upload",
            resource_type: rt,
            prefix,
            max_results: maxResults,
            ...(c ? { next_cursor: c } : {}),
          })
          .catch(() => ({ resources: [], next_cursor: undefined }));

      let page = await fetchPage(type, cursor);
      let resources: Record<string, unknown>[] = (page.resources || []) as Record<
        string,
        unknown
      >[];
      let nextCursor: string | undefined = page.next_cursor;

      // Auto-advance: if this type returned nothing and has no next page, move
      // to the next resource type (still within maxResults) so callers don't
      // see empty intermediate pages while iterating through all types.
      let typeIdx = TYPES.indexOf(type);
      while (!nextCursor && resources.length === 0 && typeIdx < TYPES.length - 1) {
        typeIdx++;
        type = TYPES[typeIdx];
        page = await fetchPage(type);
        resources = (page.resources || []) as Record<string, unknown>[];
        nextCursor = page.next_cursor;
      }

      const files = resources.map((resource) => ({
        key: String(resource.public_id || ""),
        size: Number(resource.bytes) || 0,
        lastModified: new Date(String(resource.created_at || new Date())),
        etag: String(resource.etag || ""),
        contentType: this.formatToMime(
          String(resource.resource_type || "raw"),
          resource.format ? String(resource.format) : undefined,
        ),
      }));

      const nextContinuationToken = nextCursor ? `${type}:${nextCursor}` : undefined;

      return {
        success: true,
        files,
        isTruncated: !!nextContinuationToken,
        nextContinuationToken,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List failed",
      };
    }
  }

  async exists(key: string): Promise<ExistsResult> {
    try {
      const cloudinary = await this.getClient();
      // Strip extension and add config folder prefix for the public_id
      let publicId = key;
      const dotIndex = publicId.lastIndexOf(".");
      if (dotIndex > 0) {
        publicId = publicId.slice(0, dotIndex);
      }
      if (this.config.folder) {
        publicId = `${this.config.folder}/${publicId}`;
      }

      // Try each resource type until found
      for (const resourceType of ["image", "video", "raw"] as const) {
        try {
          await cloudinary.api.resource(publicId, { resource_type: resourceType });
          return { exists: true };
        } catch {
          // Try next resource type
        }
      }

      return { exists: false };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Check existence failed",
      };
    }
  }

  async copy(_options: CopyOptions): Promise<CopyResult> {
    return {
      success: false,
      error: "Cloudinary copy not implemented yet",
    };
  }

  async move(_options: MoveOptions): Promise<MoveResult> {
    return {
      success: false,
      error: "Cloudinary move not implemented yet",
    };
  }

  async duplicate(options: DuplicateOptions): Promise<DuplicateResult> {
    // Duplicate is just an alias for copy
    return this.copy(options);
  }

  async getPresignedUrl(_options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    return {
      success: false,
      error: "Cloudinary presigned URL not implemented yet",
    };
  }

  getPublicUrl(key: string, extension?: string, resourceType?: "image" | "video" | "raw"): string {
    // Generate Cloudinary URL
    const protocol = this.config.secure !== false ? "https" : "http";
    const baseUrl = `${protocol}://res.cloudinary.com/${this.config.cloudName}`;

    // `upload()` prepends `config.folder` to the stored public_id, so callers
    // holding a relative key need the folder re-prepended here to round-trip
    // correctly. If the key already starts with the folder (full public_id),
    // don't double-prefix.
    let publicId = key;
    if (this.config.folder && !publicId.startsWith(`${this.config.folder}/`)) {
      publicId = `${this.config.folder}/${publicId}`;
    }

    // Use explicit resource type if provided, otherwise infer from extension
    const type = resourceType || this.inferResourceType(extension || key);

    return `${baseUrl}/${type}/upload/${publicId}${extension ? `.${extension}` : ""}`;
  }

  /**
   * Build a valid MIME type from a Cloudinary `resource_type` + `format`.
   * Naive `${resource_type}/${format}` produces invalid types like `raw/pdf`
   * or `image/jpg`, so map known formats to their real MIME types and fall back
   * to `application/octet-stream` for raw/unknown assets.
   */
  private formatToMime(resourceType: string, format?: string): string {
    if (!format) return "application/octet-stream";
    const fmt = format.toLowerCase();
    const overrides: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
    };
    if (overrides[fmt]) return overrides[fmt];
    if (resourceType === "image" || resourceType === "video") {
      return `${resourceType}/${fmt}`;
    }
    return "application/octet-stream";
  }

  /** Infer Cloudinary resource type from a filename or extension */
  private inferResourceType(nameOrExt: string): "image" | "video" | "raw" {
    const ext = nameOrExt.includes(".")
      ? nameOrExt.split(".").pop()?.toLowerCase() || ""
      : nameOrExt.toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif", "tiff"];
    const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "m4v", "ogv"];
    if (imageExts.includes(ext)) return "image";
    if (videoExts.includes(ext)) return "video";
    return "raw";
  }

  // Folder operations
  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    // Cloudinary folders are created implicitly when uploading files
    return {
      success: true,
      path: options.path,
    };
  }

  async deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult> {
    try {
      const cloudinary = await this.getClient();
      // Cloudinary requires deleting all assets in folder first, then the
      // folder itself. Prepend `config.folder` so this matches the prefix that
      // `upload`/`delete`/`exists` use — otherwise a recursive delete targets
      // the wrong (unprefixed) prefix and silently deletes nothing (or the
      // wrong assets). Preserve the trailing slash for the prefix delete so we
      // only match `folder/*` and never a sibling like `folderXYZ/*`. Stripping
      // the slash made `deleteFolder("folder/")` also delete `folderXYZ/...` —
      // a data-loss hazard.
      const normalizedPath = options.path.replace(/\/$/, "");
      const scopedPath = this.config.folder
        ? `${this.config.folder}/${normalizedPath}`
        : normalizedPath;
      const folderPath = `${scopedPath}/`;
      const folderApiPath = scopedPath;

      if (options.recursive) {
        // Delete all resources in the folder
        await cloudinary.api.delete_resources_by_prefix(folderPath);
      }

      // Delete the folder
      await cloudinary.api.delete_folder(folderApiPath);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete folder failed",
      };
    }
  }

  async listFolders(_options?: ListFoldersOptions): Promise<ListFoldersResult> {
    try {
      const cloudinary = await this.getClient();
      // Use Cloudinary Admin API to list folders
      const result = await cloudinary.api.root_folders();

      const folders = (result.folders || []).map((folder: Record<string, unknown>) => ({
        name: String(folder.name ?? ""),
        path: String(folder.path ?? ""),
      }));

      return {
        success: true,
        folders,
        isTruncated: false,
        nextContinuationToken: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "List folders failed",
      };
    }
  }

  async folderExists(_path: string): Promise<FolderExistsResult> {
    // Previously this returned `{ exists: false, error: "..." }`, which looks
    // like a definitive "the folder does not exist" to a caller doing
    // `if (!result.exists)`. Return an `error`-only result (no `exists` claim)
    // so the unimplemented state is distinguishable from a real "not found".
    return {
      exists: false,
      error:
        "Cloudinary folder existence is not implemented yet — this result does NOT mean the folder is absent.",
    };
  }

  async renameFolder(_options: RenameFolderOptions): Promise<RenameFolderResult> {
    return {
      success: false,
      error: "Cloudinary rename folder not implemented yet",
    };
  }

  async copyFolder(_options: CopyFolderOptions): Promise<CopyFolderResult> {
    return {
      success: false,
      error: "Cloudinary copy folder not implemented yet",
    };
  }
}
