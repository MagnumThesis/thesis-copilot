import { validateAndSanitizeUrl } from './src/worker/lib/url-metadata-extractor.js';

const urlsToTest = [
  'http://localhost',
  'http://127.0.0.1',
  'http://127.0.0.1.nip.io',
  'http://0x7f000001',
  'http://2130706433',
  'http://[::1]',
  'http://169.254.169.254',
  'http://project127.com',
  'http://192.168.1.1',
  'http://project192.168.com',
  'http://10.0.0.1',
  'http://project10.com',
];

for (const url of urlsToTest) {
  const result = validateAndSanitizeUrl(url);
  console.log(`${url}: ${result.isValid ? 'VALID' : 'INVALID (' + result.error + ')'}`);
}
