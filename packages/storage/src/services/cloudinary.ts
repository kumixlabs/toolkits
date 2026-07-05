/**
 * Cloudinary storage service implementation
 * High-level service wrapper for Cloudinary storage operations with convenience methods
 */

import { loadCloudinaryConfig } from "../config";
import { CloudinaryProvider } from "../providers/cloudinary";
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
 * Cloudinary storage service
 * High-level service for Cloudinary storage operations with convenience methods
 * @public
 */
export class CloudinaryService implements StorageInterface {
  private provider: CloudinaryProvider;
  private config: CloudinaryConfig;

  constructor();
  constructor(config: CloudinaryConfig);
  constructor(config?: CloudinaryConfig) {
    this.config = config || loadCloudinaryConfig();
    this.provider = new CloudinaryProvider(this.config);
  }

  // Utility methods
  getConfig(): CloudinaryConfig {
    return { ...this.config };
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
    contentType?: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult> {
    return this.upload({ key, file, contentType, metadata });
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
    metadata?: Record<string, string>,
  ): Promise<CopyResult> {
    return this.copy({ sourceKey, destinationKey, metadata });
  }

  async moveFile(
    sourceKey: string,
    destinationKey: string,
    metadata?: Record<string, string>,
  ): Promise<MoveResult> {
    return this.move({ sourceKey, destinationKey, metadata });
  }

  async duplicateFile(
    sourceKey: string,
    destinationKey: string,
    metadata?: Record<string, string>,
  ): Promise<DuplicateResult> {
    return this.duplicate({ sourceKey, destinationKey, metadata });
  }

  async renameFile(
    sourceKey: string,
    destinationKey: string,
    metadata?: Record<string, string>,
  ): Promise<MoveResult> {
    return this.moveFile(sourceKey, destinationKey, metadata);
  }

  async getDownloadUrl(key: string, expiresIn?: number): Promise<PresignedUrlResult> {
    return this.getPresignedUrl({ key, operation: "get", expiresIn });
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
