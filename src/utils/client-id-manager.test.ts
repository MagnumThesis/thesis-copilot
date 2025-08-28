import { getClientId, clearClientId } from './client-id-manager';

// Test client ID generation and caching
console.log('Testing Client ID Manager');

// Clear any existing ID
clearClientId();

// Get first ID
const id1 = getClientId();
console.log('First ID:', id1);

// Get second ID (should be the same)
const id2 = getClientId();
console.log('Second ID:', id2);

console.log('IDs match:', id1 === id2);

// Test clearing
clearClientId();
const id3 = getClientId();
console.log('ID after clearing:', id3);
console.log('New ID different from previous:', id1 !== id3);