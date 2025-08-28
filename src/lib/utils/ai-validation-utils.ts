/**
 * AI Validation Utilities
 * Utility functions for validating AI-related data structures and inputs
 */

import { TextSelection } from "../ai-types";

/**
 * Validates text selection for modify mode
 * @param selection - The text selection to validate
 * @returns True if the selection is valid, false otherwise
 */
export function validateTextSelection(selection: TextSelection | null): boolean {
  if (!selection) return false;

  const text = selection.text.trim();
  if (text.length === 0) return false;
  if (text.length < 3) return false; // Minimum text length for meaningful modification
  if (text.length > 5000) return false; // Maximum text length to avoid API limits

  return true;
}

/**
 * Validates that required fields are present in an object
 * @param obj - The object to validate
 * @param requiredFields - Array of required field names
 * @throws Error if any required field is missing
 */
export function validateRequiredFields(obj: Record<string, any>, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}