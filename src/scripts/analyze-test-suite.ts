import { Project, SourceFile, CallExpression } from 'ts-morph';
import { glob } from 'glob';
import * as fs from 'fs';
import * as stringSimilarity from 'string-similarity';

// Define the metadata structure
interface TestMetadata {
  filePath: string;
  fileName: string;
  requirements: string[];
  dependencies: string[];
  numberOfTests: number;
  numberOfDescribes: number;
  tests: { name: string; content: string }[];
}

interface DuplicateInfo {
  file1: string;
  test1: string;
  file2: string;
  test2: string;
  similarity: number;
}

async function analyzeTestSuite() {
  const project = new Project();
  const testFiles = await glob('src/tests/**/*.test.{ts,tsx}');

  project.addSourceFilesAtPaths(testFiles);

  const allTestMetadata: TestMetadata[] = [];
  let allTests: { filePath: string; name: string; content: string }[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const metadata = analyzeSourceFile(sourceFile);
    allTestMetadata.push(metadata);
    metadata.tests.forEach(test => {
      allTests.push({ filePath: metadata.filePath, ...test });
    });
  }

  const duplicates = detectDuplicateTests(allTests);

  const report = {
    analysis: allTestMetadata,
    duplicates,
  };

  // Generate a report
  fs.writeFileSync('test-suite-analysis.json', JSON.stringify(report, null, 2));

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
  const { numberOfDescribes, numberOfTests, tests } = countTests(sourceFile);

  return {
    filePath,
    fileName,
    requirements,
    dependencies,
    numberOfTests,
    numberOfDescribes,
    tests,
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

function countTests(sourceFile: SourceFile): { numberOfDescribes: number; numberOfTests: number; tests: { name: string; content: string }[] } {
  let numberOfDescribes = 0;
  let numberOfTests = 0;
  const tests: { name: string; content: string }[] = [];

  sourceFile.getDescendants().forEach(node => {
    if (node.getKindName() === 'CallExpression') {
      const callExpression = node as CallExpression;
      const expression = callExpression.getExpression();
      const expressionText = expression.getText();

      if (expressionText === 'describe') {
        numberOfDescribes++;
      }

      if (expressionText === 'it') {
        numberOfTests++;
        const args = callExpression.getArguments();
        if (args.length > 1) {
          const testName = args[0].getText();
          const testContent = args[1].getText();
          tests.push({ name: testName, content: testContent });
        }
      }
    }
  });

  return { numberOfDescribes, numberOfTests, tests };
}

function detectDuplicateTests(tests: { filePath: string; name: string; content: string }[]): DuplicateInfo[] {
  const duplicates: DuplicateInfo[] = [];
  const similarityThreshold = 0.8;

  for (let i = 0; i < tests.length; i++) {
    for (let j = i + 1; j < tests.length; j++) {
      const similarity = stringSimilarity.compareTwoStrings(tests[i].content, tests[j].content);
      if (similarity >= similarityThreshold) {
        duplicates.push({
          file1: tests[i].filePath,
          test1: tests[i].name,
          file2: tests[j].filePath,
          test2: tests[j].name,
          similarity,
        });
      }
    }
  }

  return duplicates;
}

analyzeTestSuite().catch(console.error);