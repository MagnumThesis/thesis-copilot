const urlObj = new URL('http://project127.com');
console.log(urlObj.hostname.startsWith('127.'));

const urlObj2 = new URL('http://192.168.1.1.nip.io');
console.log(urlObj2.hostname.startsWith('192.168.'));

const urlObj3 = new URL('http://169.254.169.254');
console.log(urlObj3.hostname);
