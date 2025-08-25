const { exec } = require('child_process');

// Execute npm run build and capture output
exec('npm run build', (error, stdout, stderr) => {
  console.log('Analyzing build errors...');
  
  // Combine stdout and stderr since TypeScript errors might be in either
  const output = (stdout || '') + (stderr || '');
  
  if (output) {
    // Count different types of errors
    const errorLines = output.split('\
');
    const errorTypes = {};
    const files = new Set();
    
    // Regex to match TypeScript error format
    const errorRegex = /error TS(\d+):/;
    
    errorLines.forEach(line => {
      const match = line.match(errorRegex);
      if (match) {
        const errorCode = match[1];
        errorTypes[errorCode] = (errorTypes[errorCode] || 0) + 1;
        
        // Extract file name (before the colon and line number)
        const fileMatch = line.match(/^([^\(]+?):(\d+):/);
        if (fileMatch) {
          files.add(fileMatch[1]);
        }
      }
    });
    
    console.log('Error Summary:');
    console.log(`Total unique error types: ${Object.keys(errorTypes).length}`);
    console.log(`Total files with errors: ${files.size}`);
    
    if (Object.keys(errorTypes).length > 0) {
      console.log('\
\
Error types and counts:');
      Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .forEach(([code, count]) => {
          console.log(`  TS${code}: ${count}`);
        });
        
      console.log('\
\
Most common error types:');
      Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([code, count]) => {
          let description = '';
          switch(code) {
            case '2339': description = 'Property does not exist on type'; break;
            case '18046': description = 'is of type unknown'; break;
            case '2345': description = 'Argument not assignable to parameter'; break;
            case '2322': description = 'Type not assignable to type'; break;
            case '2739': description = 'Type missing properties'; break;
            case '2740': description = 'Type missing properties (alternative)'; break;
            case '1010': description = '*/ expected (comment block)'; break;
            case '1109': description = 'Expression expected'; break;
            case '1161': description = 'Unterminated regular expression'; break;
            case '1128': description = 'Declaration or statement expected'; break;
            case '1005': description = '; expected'; break;
            case '1160': description = 'Unterminated template literal'; break;
            case '17002': description = 'Expected corresponding JSX closing tag'; break;
            case '7006': description = 'Parameter implicitly has an any type'; break;
            case '7053': description = 'Element implicitly has an any type'; break;
            case '2353': description = 'Object literal may only specify known properties'; break;
            case '2551': description = 'Property does not exist (did you mean...)'; break;
            default: description = 'Other error';
          }
          console.log(`  TS${code}: ${count} (${description})`);
        });
    } else {
      console.log('No TypeScript errors found in the output.');
    }
  } else {
    console.log('No output from build command.');
  }
});