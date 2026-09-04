const DOMAIN = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?|https?:\/\/\[[a-fA-F0-9:]+\](:\d+)?(\/.*)?|https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|169\.254\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?(\/.*)?$/;

console.log('not-a-url', DOMAIN.test('https://not-a-url'));
console.log('invalid-url', DOMAIN.test('https://invalid-url'));
console.log('https://10.example.com', DOMAIN.test('https://10.example.com'));
console.log('http://169.254.169.254', DOMAIN.test('http://169.254.169.254'));
console.log('http://127.0.0.1.nip.io', DOMAIN.test('http://127.0.0.1.nip.io'));
console.log('http://[::1]', DOMAIN.test('http://[::1]'));
