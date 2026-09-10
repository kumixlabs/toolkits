/**
 * Utility functions for CSS class name management
 * Provides optimized class name merging with Tailwind CSS conflict resolution
 * Essential for component styling and conditional class application
 */

import { cn as _cn } from "cn";

/**
 * Merges Tailwind class names, resolving any conflicts.
 * Combines clsx-style arguments (strings, arrays, objects, conditionals) with
 * Tailwind CSS conflict resolution.
 *
 * @param inputs - Class names, conditional expressions, arrays, or objects to merge
 * @returns Space-separated merged class name string
 *
 * @example
 * ```tsx
 * // Basic usage
 * <div className={cn("px-4 py-2", "bg-blue-500", "text-white")}>
 *   Button
 * </div>
 *
 * // With conditional classes
 * <div className={cn(
 *   "px-4 py-2",
 *   isActive && "bg-blue-500",
 *   !isActive && "bg-gray-200",
 *   isDisabled && "opacity-50 cursor-not-allowed"
 * )}>
 *   Button
 * </div>
 *
 * // Resolving conflicts (last one wins)
 * <div className={cn("px-2", "px-4")}>
 *   // Results in "px-4", not "px-2 px-4"
 * </div>
 * ```
 */
export const cn = _cn;
