import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * @function cn
 * @description A utility function to conditionally join CSS class names together.
 * Combines `clsx` for conditional class joining and `tailwind-merge` for resolving Tailwind CSS conflicts.
 * @param {ClassValue[]} inputs - An array of class values (strings, objects, arrays).
 * @returns {string} The merged and joined CSS class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
