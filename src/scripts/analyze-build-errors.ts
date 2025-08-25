import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface BuildError {
  file: string;
  line: number;
  column: number;
  errorCode: string;
  message: string;
}

interface ErrorSummary {
  files: string[];
  errorTypes: Record<string, number>;
  totalErrors: number;
}

async function parseBuildErrors(): Promise<ErrorSummary> {
  try {
    const { stdout, stderr } = await execPromise('npm run build');
    // This won't execute as build fails, so we'll need to capture errors from stderr
    console.log('Build output:', stdout);
    return {
      files: [],
      errorTypes: {},
      totalErrors: 0
    };
  } catch (error: any) {
    // Parse errors from stderr
    const errorOutput = error.stderr || '';
    return analyzeErrorOutput(errorOutput);
  }
}

function analyzeErrorOutput(output: string): ErrorSummary {
  const errors: BuildError[] = [];
  const errorLines = output.split('\n');
  
  // Regex to match TypeScript error format
  const errorRegex = /error TS(\d+): (.+) in (.+) at line (\d+), column (\d+)/;
  
  for (const line of errorLines) {
    const match = line.match(errorRegex);
    if (match) {
      errors.push({
        errorCode: match[1],
        message: match[2],
        file: match[3],
        line: parseInt(match[4], 10),
        column: parseInt(match[5], 10)
      });
    }
  }
  
  // Categorize errors
  const files = [...new Set(errors.map(e => e.file))];
  const errorTypes: Record<string, number> = {};
  
  errors.forEach(error => {
    errorTypes[error.errorCode] = (errorTypes[error.errorCode] || 0) + 1;
  });
  
  return {
    files,
    errorTypes,
    totalErrors: errors.length
  };
}

// Run if called directly
if (require.main === module) {
  parseBuildErrors().then(summary => {
    console.log('Error Summary:');
    console.log(`Total Errors: ${summary.totalErrors}`);
    console.log('Files with errors:', summary.files);
    console.log('Error types:', summary.errorTypes);
  }).catch(error => {
    console.error('Error analyzing build:', error);
  });
}

// Export for use in other scripts
export { BuildError, ErrorSummary, parseBuildErrors, analyzeErrorOutput };