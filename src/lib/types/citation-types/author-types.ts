/**
 * Author Types and Utilities
 * Contains types and utilities related to authors and contributors
 */

/**
 * @interface Author
 * @description Interface for an author.
 */
export interface Author {
  /** @property {string} firstName - The first name of the author. */
  firstName: string;
  /** @property {string} lastName - The last name of the author. */
  lastName: string;
  /** @property {string} [middleName] - The middle name of the author. */
  middleName?: string;
  /** @property {string} [suffix] - The suffix of the author's name. */
  suffix?: string;
  /** @property {string} [affiliation] - The affiliation of the author. */
  affiliation?: string;
}

/**
 * Author conversion utilities
 */

/**
 * @function normalizeAuthor
 * @description Normalizes an author from a string to an Author object.
 * @param {string | Author} author - The author to normalize.
 * @returns {Author} The normalized author.
 */
export const normalizeAuthor = (author: string | Author): Author => {
  if (typeof author === 'string') {
    const parts = author.trim().split(/\s+/);
    if (parts.length === 1) {
      return {
        firstName: '',
        lastName: parts[0]
      };
    } else if (parts.length === 2) {
      return {
        firstName: parts[0],
        lastName: parts[1]
      };
    } else {
      return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(' ')
      };
    }
  }
  return author;
};

/**
 * @function normalizeAuthors
 * @description Normalizes an array of authors.
 * @param {(string | Author)[]} authors - The authors to normalize.
 * @returns {Author[]} The normalized authors.
 */
export const normalizeAuthors = (authors: (string | Author)[]): Author[] => {
  return authors.map(normalizeAuthor);
};

/**
 * @function authorToString
 * @description Converts an author to a string.
 * @param {string | Author} author - The author to convert.
 * @returns {string} The string representation of the author.
 */
export const authorToString = (author: string | Author): string => {
  if (typeof author === 'string') {
    return author;
  }
  const parts = [author.firstName, author.middleName, author.lastName].filter(Boolean);
  return parts.join(' ');
};

/**
 * @function authorsToStrings
 * @description Converts an array of authors to an array of strings.
 * @param {(string | Author)[]} authors - The authors to convert.
 * @returns {string[]} The string representations of the authors.
 */
export const authorsToStrings = (authors: (string | Author)[]): string[] => {
  return authors.map(authorToString);
};
