const domains = [
  '127.0.0.1',
  'sub.127.0.0.1.nip.io',
  '169.254.169.254',
  '169.254.169.254.nip.io',
  '10.0.0.1',
  'sub.10.0.0.1.nip.io',
  '192.168.1.1',
  '8.10.8.8', // legitimate
  '99.127.1.1', // legitimate
  '10.com', // legitimate
  'my10.com', // legitimate
];

function isPrivate(hostname: string) {
  // We want to block things that look like local IP domains (like 127.0.0.1.nip.io)
  // or raw IPs. A raw IP will only contain numbers and dots.

  // So we can check if it matches a private IP pattern exactly,
  // or if it ends with a known dynamic DNS suffix (but that's hard to enumerate).

  // Instead of matching anywhere, we check if the hostname matches:
  // - IPv4 private CIDRs (exact or as a subdomain part where it forms the whole IP string? No, nip.io embeds it exactly like `127.0.0.1.nip.io`)

  // Pattern for private IPs in nip.io etc.:
  const ipMatch = hostname.match(/(?:^|\.)(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+)(?:\.|$)/);

  if (ipMatch) return true;

  // Also check if the hostname is exactly localhost or [::1]
  if (hostname === 'localhost' || hostname === '[::1]') return true;

  return false;
}

domains.forEach(d => console.log(d, isPrivate(d)));
