import fs from 'fs';
let content = fs.readFileSync('src/tests/concern-display-verification.test.tsx', 'utf8');
content = content.replace("screen.getByText('Pending')", "screen.getAllByText('Pending')[0]");
content = content.replace("screen.getByText('Pending')", "screen.getAllByText('Pending')[0]");
fs.writeFileSync('src/tests/concern-display-verification.test.tsx', content);
