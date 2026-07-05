/**
 * Storage interface definition
 * Defines the unified interface that all storage providers must implement
 */

import type {
  BatchDeleteOptions,
  BatchDeleteResult,
  CopyOptions,
  CopyResult,
  DeleteOptions,
  DeleteResult,
  DownloadOptions,
  DownloadResult,
  DuplicateOptions,
  DuplicateResult,
  ExistsResult,
  ListOptions,
  ListResult,
  MoveOptions,
  MoveResult,
  PresignedUrlOptions,
  PresignedUrlResult,
  UploadOptions,
  UploadResult,
} from "./file-operations";
import type {
  CopyFolderOptions,
  CopyFolderResult,
  CreateFolderOptions,
  CreateFolderResult,
  DeleteFolderOptions,
  DeleteFolderResult,
  FolderExistsResult,
  ListFoldersOptions,
  ListFoldersResult,
  RenameFolderOptions,
  RenameFolderResult,
} from "./folder-operations";

/**
 * Main storage interface that all providers must implement
 * Provides unified API for file and folder operations across different storage providers
 * @public
 */
export interface StorageInterface {
  // File operations
  /** Upload a file to storage */
  upload(options: UploadOptions): Promise<UploadResult>;
  /** Download a file from storage */
  download(options: DownloadOptions): Promise<DownloadResult>;
  /** Delete a single file from storage */
  delete(options: DeleteOptions): Promise<DeleteResult>;
  /** Delete multiple files from storage */
  batchDelete(options: BatchDeleteOptions): Promise<BatchDeleteResult>;
  /** List files in storage */
  list(options?: ListOptions): Promise<ListResult>;
  /** Check if a file exists in storage */
  exists(key: string): Promise<ExistsResult>;
  /** Copy a file within storage */
  copy(options: CopyOptions): Promise<CopyResult>;
  /** Move a file within storage */
  move(options: MoveOptions): Promise<MoveResult>;
  /** Duplicate a file within storage */
  duplicate(options: DuplicateOptions): Promise<DuplicateResult>;
  /** Generate a presigned URL for file access */
  getPresignedUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult>;
  /** Get public URL for a file */
  getPublicUrl(key: string): string;

  // Folder operations
  /** Create a folder in storage */
  createFolder(options: CreateFolderOptions): Promise<CreateFolderResult>;
  /** Delete a folder from storage */
  deleteFolder(options: DeleteFolderOptions): Promise<DeleteFolderResult>;
  /** List folders in storage */
  listFolders(options?: ListFoldersOptions): Promise<ListFoldersResult>;
  /** Check if a folder exists in storage */
  folderExists(path: string): Promise<FolderExistsResult>;
  /** Rename a folder in storage */
  renameFolder(options: RenameFolderOptions): Promise<RenameFolderResult>;
  /** Copy a folder within storage */
  copyFolder(options: CopyFolderOptions): Promise<CopyFolderResult>;
}
