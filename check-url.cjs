const DOMAIN = /^https?:\/\/([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\])(:\d+)?(\/.*)?$/;
console.log('not-a-url', DOMAIN.test('https://not-a-url'));
console.log('invalid-url', DOMAIN.test('https://invalid-url'));
