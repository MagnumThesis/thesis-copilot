/**
 * Client ID Manager
 * Generates and manages a unique client ID for privacy management
 * when no authentication system is in place.
 */

const CLIENT_ID_KEY = 'ai-searcher-client-id';
const CLIENT_ID_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ClientIdCache {
  id: string;
  timestamp: number;
}

/**
 * Generates a UUID v4
 * @returns A unique identifier
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets or creates a client ID
 * @returns A unique client ID
 */
export function getClientId(): string {
  try {
    // Try to get from sessionStorage first (persists during session)
    const sessionId = sessionStorage.getItem(CLIENT_ID_KEY);
    if (sessionId) {
      return sessionId;
    }

    // Try to get from localStorage with expiration check
    const cachedData = localStorage.getItem(CLIENT_ID_KEY);
    if (cachedData) {
      const cache: ClientIdCache = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid (less than 24 hours old)
      if (now - cache.timestamp < CLIENT_ID_CACHE_DURATION) {
        // Store in sessionStorage for the current session
        sessionStorage.setItem(CLIENT_ID_KEY, cache.id);
        return cache.id;
      }
    }

    // Generate new ID
    const newId = generateUUID();
    
    // Cache it
    const cache: ClientIdCache = {
      id: newId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(CLIENT_ID_KEY, JSON.stringify(cache));
    sessionStorage.setItem(CLIENT_ID_KEY, newId);
    
    return newId;
  } catch (error) {
    // Fallback: generate a new ID without caching if there's an error
    console.warn('Error accessing client ID storage, generating new ID without cache:', error);
    return generateUUID();
  }
}

/**
 * Clears the client ID from storage
 */
export function clearClientId(): void {
  try {
    sessionStorage.removeItem(CLIENT_ID_KEY);
    localStorage.removeItem(CLIENT_ID_KEY);
  } catch (error) {
    console.warn('Error clearing client ID storage:', error);
  }
}