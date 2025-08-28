import { Project, SourceFile } from 'ts-morph';
import { glob } from 'glob';
import * as fs from 'fs';

// Define the metadata structure
interface TestMetadata {
  filePath: string;
  fileName: string;
  requirements: string[];
  dependencies: string[];
  numberOfTests: number;
  numberOfDescribes: number;
}

async function analyzeTestSuite() {
  const project = new Project();
  const testFiles = await glob('src/tests/**/*.test.{ts,tsx}');

  project.addSourceFilesAtPaths(testFiles);

  const allTestMetadata: TestMetadata[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const metadata = analyzeSourceFile(sourceFile);
    allTestMetadata.push(metadata);
  }

  // Generate a report
  fs.writeFileSync('test-suite-analysis.json', JSON.stringify(allTestMetadata, null, 2));

  console.log('Test suite analysis complete. Report generated at test-suite-analysis.json');
}

function analyzeSourceFile(sourceFile: SourceFile): TestMetadata {
  const filePath = sourceFile.getFilePath();
  const fileName = sourceFile.getBaseName();

  // Extract requirements from JSDoc comments
  const requirements = extractRequirements(sourceFile);

  // Extract dependencies from import declarations
  const dependencies = sourceFile.getImportDeclarations().map(imp => imp.getModuleSpecifierValue());

  // Count describe and it blocks
  const { numberOfDescribes, numberOfTests } = countTests(sourceFile);

  return {
    filePath,
    fileName,
    requirements,
    dependencies,
    numberOfTests,
    numberOfDescribes,
  };
}

function extractRequirements(sourceFile: SourceFile): string[] {
  const requirements: string[] = [];
  const regex = /@requirement\s+([\w.-]+)/g;

  sourceFile.getDescendants().forEach(node => {
    if (node.getKindName() === 'JSDoc') {
      const comment = node.getText();
      let match;
      while ((match = regex.exec(comment)) !== null) {
        requirements.push(match[1]);
      }
    }
  });

  return requirements;
}

function countTests(sourceFile: SourceFile): { numberOfDescribes: number; numberOfTests: number } {
    let numberOfDescribes = 0;
    let numberOfTests = 0;

    sourceFile.getDescendants().forEach(node => {
        if (node.getKindName() === 'CallExpression') {
            const expression = node.getText();
            if (expression.startsWith('describe(')) {
                numberOfDescribes++;
            }
            if (expression.startsWith('it(')) {
                numberOfTests++;
            }
        }
    });

    return { numberOfDescribes, numberOfTests };
}

analyzeTestSuite().catch(console.error);
