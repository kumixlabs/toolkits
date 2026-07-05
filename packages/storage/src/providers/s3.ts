/**
 * S3-compatible storage provider implementation
 * Provides cloud storage operations using AWS S3 SDK for S3-compatible services
 */

import { S3Client } from "@aws-sdk/client-s3";

import { FileOperations } from "../operations/file-operations";
import { FolderOperations } from "../operations/folder-operations";
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
  private client: S3Client;
  private config: S3Config;
  private fileOps: FileOperations;
  private folderOps: FolderOperations;

  constructor(config: S3Config) {
    this.config = config;

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle || false,
    });

    this.fileOps = new FileOperations(this.client, this.config);
    this.folderOps = new FolderOperations(this.client, this.config);
  }

  // File operations
  async upload(options: UploadOptions): Promise<UploadResult> {
    return this.fileOps.upload(options);
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    return this.fileOps.download(options);
  }

  async delete(options: DeleteOptions): Promise<DeleteResult> {
    return this.fileOps.delete(options);
  }

  async batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult> {
    return this.fileOps.batchDelete(options);
  }

  async list(options?: ListOptions): Promise<ListResult> {
    return this.fileOps.list(options);
  }

  async exists(key: string): Promise<ExistsResult> {
    return this.fileOps.exists(key);
  }

  async copy(options: CopyOptions): Promise<CopyResult> {
    return this.fileOps.copy(options);
  }

  async move(options: MoveOptions): Promise<MoveResult> {
    return this.fileOps.move(options);
  }

  async duplicate(options: DuplicateOptions): Promise<DuplicateResult> {
    return this.fileOps.duplicate(options);
  }

  async getPresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    return this.fileOps.getPresignedUrl(options);
  }

  getPublicUrl(key: string): string {
    return this.fileOps.getPublicUrl(key);
  }

  // Folder operations
  async createFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
    return this.folderOps.createFolder(options);
  }

  async deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult> {
    return this.folderOps.deleteFolder(options);
  }

  async listFolders(options?: ListFoldersOptions): Promise<ListFoldersResult> {
    return this.folderOps.listFolders(options);
  }

  async folderExists(path: string): Promise<FolderExistsResult> {
    return this.folderOps.folderExists(path);
  }

  async renameFolder(options: RenameFolderOptions): Promise<RenameFolderResult> {
    return this.folderOps.renameFolder(options);
  }

  async copyFolder(options: CopyFolderOptions): Promise<CopyFolderResult> {
    return this.folderOps.copyFolder(options);
  }
}
