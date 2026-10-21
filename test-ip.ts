const checkUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    console.log(`URL: ${url}`);
    console.log(`Hostname: ${urlObj.hostname}`);
    console.log(`startsWith('127.'): ${urlObj.hostname.startsWith('127.')}`);
    console.log('---');
  } catch (e) {
    console.log(`Error parsing ${url}`);
  }
};

checkUrl('http://127.0.0.1');
checkUrl('http://1270.0.0.1');
checkUrl('http://2130706433'); // 127.0.0.1 in decimal
checkUrl('http://0x7F000001'); // 127.0.0.1 in hex
checkUrl('http://127.0.0.1.nip.io');
