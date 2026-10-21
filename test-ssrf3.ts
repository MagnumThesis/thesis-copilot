const checkUrl = (urlStr: string) => {
  try {
    const urlObj = new URL(urlStr);
    const hn = urlObj.hostname;

    // Check for localhost or private IPs (basic security)
    const isPrivate = hn === 'localhost' ||
        /(^|\.)localhost(\.|$)/i.test(hn) ||
        /(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/.test(hn) ||
        /(^|\.)192\.168\.\d+\.\d+(?:\.|$)/.test(hn) ||
        /(^|\.)10\.\d+\.\d+\.\d+(?:\.|$)/.test(hn) ||
        /(^|\.)172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(?:\.|$)/.test(hn) ||
        /(^|\.)169\.254\.\d+\.\d+(?:\.|$)/.test(hn) ||
        hn === '[::1]';

    console.log(`${hn}: ${isPrivate ? 'PRIVATE' : 'PUBLIC'}`);
  } catch (e) {
    console.log(`Error parsing ${urlStr}`);
  }
};

checkUrl('http://127.0.0.1');
checkUrl('http://127.0.0.1.nip.io');
checkUrl('http://project127.com');
checkUrl('http://192.168.1.1.nip.io');
checkUrl('http://project192.168.com');
checkUrl('http://169.254.169.254');
checkUrl('http://[::1]');
checkUrl('http://10.0.0.1');
