/**
 * S3 storage service implementation
 * High-level service wrapper for S3-compatible storage operations with convenience methods
 */

import { loadS3Config } from "../config";
import { S3Provider } from "../providers/s3";
import type {
  BatchDeleteOptions,
  BatchDeleteResult,
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
  S3Config,
  StorageInterface,
  UploadOptions,
  UploadResult,
} from "../types";

/**
 * S3 storage service
 * High-level service for S3-compatible storage operations with convenience methods
 * @public
 */
export class S3Service implements StorageInterface {
  private provider: S3Provider;
  private config: S3Config;

  constructor();
  constructor(config: S3Config);
  constructor(config?: S3Config) {
    this.config = config || loadS3Config();
    this.provider = this.createProvider(this.config);
  }

  private createProvider(config: S3Config): S3Provider {
    switch (config.provider) {
      case "aws":
      case "cloudflare-r2":
      case "minio":
      case "digitalocean":
      case "supabase":
      case "custom":
        return new S3Provider(config);
      default:
        throw new Error(`Unsupported S3 provider: ${config.provider}`);
    }
  }

  // Utility methods
  getConfig(): S3Config {
    return { ...this.config };
  }

  getBucket(): string {
    return this.config.bucket;
  }

  getRegion(): string {
    return this.config.region;
  }

  getProvider(): string {
    return this.config.provider;
  }

  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  // File operations
  async upload(options: UploadOptions): Promise<UploadResult> {
    return this.provider.upload(options);
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    return this.provider.download(options);
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    return this.provider.delete(options);
  }

  async batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult> {
    return this.provider.batchDelete(options);
  }

  async list(options?: ListOptions): Promise<ListResult> {
    return this.provider.list(options);
  }

  async exists(key: string): Promise<ExistsResult> {
    return this.provider.exists(key);
  }

  async copy(options: CopyOptions): Promise<CopyResult> {
    return this.provider.copy(options);
  }

  async move(options: MoveOptions): Promise<MoveResult> {
    return this.provider.move(options);
  }

  async duplicate(options: DuplicateOptions): Promise<DuplicateResult> {
    return this.provider.duplicate(options);
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    return this.provider.getPresignedUrl(options);
  }

  // Folder operations
  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    return this.provider.createFolder(options);
  }

  async deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult> {
    return this.provider.deleteFolder(options);
  }

  async listFolders(options?: ListFoldersOptions): Promise<ListFoldersResult> {
    return this.provider.listFolders(options);
  }

  async folderExists(path: string): Promise<FolderExistsResult> {
    return this.provider.folderExists(path);
  }

  async renameFolder(options: RenameFolderOptions): Promise<RenameFolderResult> {
    return this.provider.renameFolder(options);
  }

  async copyFolder(options: CopyFolderOptions): Promise<CopyFolderResult> {
    return this.provider.copyFolder(options);
  }

  // Convenience methods
  async uploadFile(
    key: string,
    file: Buffer | Uint8Array | string,
    options?: Partial<UploadOptions>,
  ): Promise<UploadResult> {
    return this.upload({
      key,
      file,
      ...options,
    });
  }

  async downloadFile(key: string): Promise<DownloadResult> {
    return this.download({ key });
  }

  async deleteFile(key: string): Promise<DeleteResult> {
    return this.delete({ key });
  }

  async deleteFiles(keys: string[]): Promise<BatchDeleteResult> {
    return this.batchDelete({ keys });
  }

  async listFiles(prefix?: string, maxKeys?: number): Promise<ListResult> {
    return this.list({ prefix, maxKeys });
  }

  async fileExists(key: string): Promise<boolean> {
    const result = await this.exists(key);
    return result.exists;
  }

  async copyFile(
    sourceKey: string,
    destinationKey: string,
    options?: Partial<CopyOptions>,
  ): Promise<CopyResult> {
    return this.copy({
      sourceKey,
      destinationKey,
      ...options,
    });
  }

  async moveFile(
    sourceKey: string,
    destinationKey: string,
    options?: Partial<MoveOptions>,
  ): Promise<MoveResult> {
    return this.move({
      sourceKey,
      destinationKey,
      ...options,
    });
  }

  async duplicateFile(
    sourceKey: string,
    destinationKey: string,
    options?: Partial<DuplicateOptions>,
  ): Promise<DuplicateResult> {
    return this.duplicate({
      sourceKey,
      destinationKey,
      ...options,
    });
  }

  async renameFile(
    sourceKey: string,
    newKey: string,
    options?: Partial<MoveOptions>,
  ): Promise<MoveResult> {
    return this.moveFile(sourceKey, newKey, options);
  }

  async getDownloadUrl(key: string, expiresIn?: number): Promise<PresignedUrlResult> {
    return this.getPresignedUrl({
      key,
      operation: "get",
      expiresIn,
    });
  }

  async getUploadUrl(
    key: string,
    contentType?: string,
    expiresIn?: number,
  ): Promise<PresignedUrlResult> {
    return this.getPresignedUrl({
      key,
      operation: "put",
      contentType,
      expiresIn,
    });
  }

  // Folder convenience methods
  async createFolderPath(path: string): Promise<CreateFolderResult> {
    return this.createFolder({ path });
  }

  async deleteFolderPath(path: string, recursive = false): Promise<DeleteFolderResult> {
    return this.deleteFolder({ path, recursive });
  }

  async folderPathExists(path: string): Promise<boolean> {
    const result = await this.folderExists(path);
    return result.exists;
  }

  async renameFolderPath(oldPath: string, newPath: string): Promise<RenameFolderResult> {
    return this.renameFolder({ oldPath, newPath });
  }

  async copyFolderPath(
    sourcePath: string,
    destinationPath: string,
    recursive = true,
  ): Promise<CopyFolderResult> {
    return this.copyFolder({ sourcePath, destinationPath, recursive });
  }
}
