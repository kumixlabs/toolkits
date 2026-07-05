/**
 * Folder operation types and interfaces
 * Defines types for folder creation, deletion, listing, and other folder operations
 */

import type { FileInfo, FolderInfo } from "./base";

// Folder create options
export interface CreateFolderOptions {
  path: string; // Full folder path (e.g., "images/thumbnails/")
}

// Folder create result
export interface CreateFolderResult {
  success: boolean;
  path?: string;
  error?: string;
}

// Folder delete options
export interface DeleteFolderOptions {
  path: string;
  recursive?: boolean; // Delete folder and all contents
}

// Folder delete result
export interface DeleteFolderResult {
  success: boolean;
  deletedFiles?: string[];
  error?: string;
}

// List folders options
export interface ListFoldersOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

// List folders result
export interface ListFoldersResult {
  success: boolean;
  folders?: FolderInfo[];
  files?: FileInfo[];
  isTruncated?: boolean;
  nextContinuationToken?: string;
  error?: string;
}

// Folder exists result
export interface FolderExistsResult {
  exists: boolean;
  folderInfo?: FolderInfo;
  error?: string;
}

// Folder rename options
export interface RenameFolderOptions {
  oldPath: string;
  newPath: string;
}

// Folder rename result
export interface RenameFolderResult {
  success: boolean;
  movedFiles?: string[];
  error?: string;
}

// Folder copy options
export interface CopyFolderOptions {
  sourcePath: string;
  destinationPath: string;
  recursive?: boolean;
}

// Folder copy result
export interface CopyFolderResult {
  success: boolean;
  copiedFiles?: string[];
  error?: string;
}
