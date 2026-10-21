import { corsOriginResolver } from './src/worker/utils/cors-resolver.js';
const fakeC = { env: {} };
console.log(corsOriginResolver('http://attacker.com', fakeC as any));
console.log(corsOriginResolver('', fakeC as any));
