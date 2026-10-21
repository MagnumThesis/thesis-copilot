import { validateAndSanitizeUrl } from './src/worker/lib/url-metadata-extractor.js';

const urlsToTest = [
  'http://localhost.test.com',
  'http://example.com/127.0.0.1',
  'http://127.0.0.1.com',
  'http://my10.domain.com'
];

for (const url of urlsToTest) {
  const result = validateAndSanitizeUrl(url);
  console.log(`${url}: ${result.isValid ? 'VALID' : 'INVALID (' + result.error + ')'}`);
}
