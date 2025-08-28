/**
 * Text Utilities
 * Utility functions for text processing, formatting, and hashing
 */

/**
 * Simple hash function for creating cache keys
 * @param str - The string to hash
 * @returns A hash string
 */
export function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str - The string to truncate
 * @param maxLength - The maximum length of the string
 * @param ellipsis - The ellipsis string to append (default: '...')
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number, ellipsis: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string to a kebab-case format
 * @param str - The string to convert
 * @returns The kebab-case string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}