const fs = require('fs');

const contentManager = fs.readFileSync('src/worker/lib/concern-status-manager.ts', 'utf8');

const regex1 = /try \{\s*const concerns = await this\.getConcernsByStatus\(conversationId\);\s*\/\/ Calculate overall statistics[\s\S]*?averageResolutionTime,\s*total,\s*toBeDone,\s*addressed,\s*rejected,\s*byCategory,\s*bySeverity\s*\};\s*\}\s*catch/;

const match1 = contentManager.match(regex1);
if(match1) {
    console.log("Match 1:");
    console.log(match1[0]);
}

const contentHandler = fs.readFileSync('src/worker/handlers/proofreader-ai.ts', 'utf8');
const regex2 = /function generateConcernStatistics\(concerns: any\[\]\): ConcernStatistics \{[\s\S]*?averageResolutionTime: 0, \/\/ Placeholder value\s*total,\s*toBeDone,\s*addressed,\s*rejected,\s*byCategory,\s*bySeverity\s*\};\s*\}/;

const match2 = contentHandler.match(regex2);
if(match2) {
    console.log("Match 2:");
    console.log(match2[0]);
}
