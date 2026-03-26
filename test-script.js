const fs = require('fs');

function findMissingAriaLabels(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = `${dir}/${file}`;
        if (fs.statSync(fullPath).isDirectory()) {
            findMissingAriaLabels(fullPath);
        } else if (file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            // Simplified check: look for Button with variant="ghost" or size="icon" and an icon component
            // but missing aria-label
            const regex = /<Button[^>]*?(variant="ghost"|size="icon")[^>]*?>\s*<[A-Z][a-zA-Z]* [^>]*\/>\s*(?!<span class[^>]*sr-only|<\/span>|.*aria-label)(.*?)<\/Button>/gs;
            let match;
            while ((match = regex.exec(content)) !== null) {
                // If it doesn't contain text nodes or sr-only
                if (!content.substring(match.index, match.index + match[0].length).includes('sr-only') && !content.substring(match.index, match.index + match[0].length).includes('aria-label')) {
                    console.log(`Potential missing aria-label in ${fullPath}:`);
                    console.log(match[0]);
                    console.log('---');
                }
            }
        }
    }
}

findMissingAriaLabels('src/components');
