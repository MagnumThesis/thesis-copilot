const fs = require('fs');
let code = fs.readFileSync('src/worker/handlers/auth.ts', 'utf8');

code = code.replace(
  "import { Context } from 'hono';",
  "import { Context } from 'hono';\nimport { getAuthContext } from '../middleware/auth-middleware';"
);

code = code.replace(
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }",
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json(\n        { success: false, error: 'Forbidden: Cannot access another user\\'s profile' },\n        403\n      );\n    }"
);

code = code.replace(
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const result = await updateUserProfile(userId, body);",
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json(\n        { success: false, error: 'Forbidden: Cannot modify another user\\'s profile' },\n        403\n      );\n    }\n\n    const result = await updateUserProfile(userId, body);"
);

code = code.replace(
  "    if (!userId || !newPassword) {\n      return c.json(\n        { success: false, error: 'User ID and new password are required' },\n        400\n      );\n    }",
  "    if (!userId || !newPassword) {\n      return c.json(\n        { success: false, error: 'User ID and new password are required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json(\n        { success: false, error: 'Forbidden: Cannot change password for another user' },\n        403\n      );\n    }"
);

fs.writeFileSync('src/worker/handlers/auth.ts', code);
