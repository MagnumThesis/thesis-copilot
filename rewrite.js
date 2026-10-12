import fs from 'fs';
const content = fs.readFileSync('src/worker/lib/concern-status-manager.ts', 'utf8');

const regex = /async getConcernStatistics[^}]+return\s+\{([^}]+)\};[^}]+\}[^}]+\}/;
const match = content.match(regex);
if(match) console.log(match[0].slice(0, 500));
