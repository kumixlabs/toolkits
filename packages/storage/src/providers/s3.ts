/**
 * S3-compatible storage provider implementation
 * Provides cloud storage operations using AWS S3 SDK for S3-compatible services
 */

import type { S3Client } from "@aws-sdk/client-s3";

import { FileOperations } from "../operations/file-operations";
import { FolderOperations } from "../operations/folder-operations";
import { loadS3Sdk } from "../operations/s3-sdk";
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
 * S3-compatible storage provider
 * Implements StorageInterface for AWS S3 and S3-compatible services
 * @internal
 */
export class S3Provider implements StorageInterface {
  private config: S3Config;
  private _client: S3Client | null = null;
  private _fileOps: FileOperations | null = null;
  private _folderOps: FolderOperations | null = null;

  constructor(config: S3Config) {
    this.config = config;
  }

  /**
   * Lazily construct the S3 client and operation helpers. The `@aws-sdk/client-s3`
   * dependency is imported dynamically so the optional peer isn't required at
   * module load — consumers using only Cloudinary can import the package without
   * installing it.
   */
  private async getFileOps(): Promise<FileOperations> {
    if (!this._fileOps) {
      const client = await this.getClient();
      this._fileOps = new FileOperations(client, this.config);
    }
    return this._fileOps;
  }

  private async getFolderOps(): Promise<FolderOperations> {
    if (!this._folderOps) {
      const client = await this.getClient();
      this._folderOps = new FolderOperations(client, this.config);
    }
    return this._folderOps;
  }

  private async getClient(): Promise<S3Client> {
    if (!this._client) {
      const { S3Client } = await loadS3Sdk();
      this._client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
          // Surface STS / temporary credentials when provided. Previously the
          // session token was dropped, breaking AWS STS / SSO / role-chain auth.
          ...(this.config.sessionToken ? { sessionToken: this.config.sessionToken } : {}),
        },
        endpoint: this.config.endpoint,
        forcePathStyle: this.config.forcePathStyle ?? false,
      });
    }
    return this._client;
  }

  // File operations
  async upload(options: UploadOptions): Promise<UploadResult> {
    return (await this.getFileOps()).upload(options);
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    return (await this.getFileOps()).download(options);
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    return (await this.getFileOps()).delete(options);
  }

  async batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult> {
    return (await this.getFileOps()).batchDelete(options);
  }

  async list(options?: ListOptions): Promise<ListResult> {
    return (await this.getFileOps()).list(options);
  }

  async exists(key: string): Promise<ExistsResult> {
    return (await this.getFileOps()).exists(key);
  }

  async copy(options: CopyOptions): Promise<CopyResult> {
    return (await this.getFileOps()).copy(options);
  }

  async move(options: MoveOptions): Promise<MoveResult> {
    return (await this.getFileOps()).move(options);
  }

  async duplicate(options: DuplicateOptions): Promise<DuplicateResult> {
    return (await this.getFileOps()).duplicate(options);
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    return (await this.getFileOps()).getPresignedUrl(options);
  }

  getPublicUrl(key: string): string {
    // `getPublicUrl` is synchronous and does not touch the S3 client, so it must
    // not force-load the SDK. Reuse an already-initialized `_fileOps` when
    // present; otherwise build a throwaway (NOT cached, so it can't poison the
    // lazy client init that a later async operation performs).
    if (this._fileOps) {
      return this._fileOps.getPublicUrl(key);
    }
    return new FileOperations(null as unknown as S3Client, this.config).getPublicUrl(key);
  }

  // Folder operations
  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    return (await this.getFolderOps()).createFolder(options);
  }

  async deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult> {
    return (await this.getFolderOps()).deleteFolder(options);
  }

  async listFolders(options?: ListFoldersOptions): Promise<ListFoldersResult> {
    return (await this.getFolderOps()).listFolders(options);
  }

  async folderExists(path: string): Promise<FolderExistsResult> {
    return (await this.getFolderOps()).folderExists(path);
  }

  async renameFolder(options: RenameFolderOptions): Promise<RenameFolderResult> {
    return (await this.getFolderOps()).renameFolder(options);
  }

  async copyFolder(options: CopyFolderOptions): Promise<CopyFolderResult> {
    return (await this.getFolderOps()).copyFolder(options);
  }
}
