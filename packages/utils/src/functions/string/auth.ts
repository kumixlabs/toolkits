/**
 * Get avatar size class name
 * @param size - Avatar size ('sm', 'lg', or null/undefined for default)
 * @returns Tailwind CSS class name for avatar size
 */
export function getSizeAvatar(size: string | null | undefined) {
  return size === "sm" ? "size-6" : size === "lg" ? "size-10" : "size-8";
}

/**
 * Get user name from user object
 * @param user - User object
 * @returns User name
 */
export function getUserName(
  // biome-ignore lint/suspicious/noExplicitAny: <>
  user: any | null | undefined,
) {
  return user?.name || user?.displayUsername || user?.username || user?.email;
}
