const fs = require('fs');
let content = fs.readFileSync('src/worker/handlers/auth.ts', 'utf8');

// Add import for getAuthContext
content = content.replace(
  "import {\n  registerUser,",
  "import { getAuthContext } from '../middleware/auth-middleware';\nimport {\n  registerUser,"
);

// Add IDOR check to getUserProfileHandler
content = content.replace(
  "    const userId = c.req.param('userId');\n\n    if (!userId) {",
  "    const userId = c.req.param('userId');\n\n    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json({ success: false, error: 'Forbidden' }, 403);\n    }"
);
// Remove the duplicate block caused by above replacement
content = content.replace(
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json({ success: false, error: 'Forbidden' }, 403);\n    }\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }",
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json({ success: false, error: 'Forbidden' }, 403);\n    }"
);

// Add IDOR check to updateUserProfileHandler
content = content.replace(
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const result = await updateUserProfile(userId, body);",
  "    if (!userId) {\n      return c.json(\n        { success: false, error: 'User ID is required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json({ success: false, error: 'Forbidden' }, 403);\n    }\n\n    const result = await updateUserProfile(userId, body);"
);

// Add IDOR check to changePasswordHandler
content = content.replace(
  "    if (!userId || !newPassword) {\n      return c.json(\n        { success: false, error: 'User ID and new password are required' },\n        400\n      );\n    }\n\n    // Validate password",
  "    if (!userId || !newPassword) {\n      return c.json(\n        { success: false, error: 'User ID and new password are required' },\n        400\n      );\n    }\n\n    const authContext = getAuthContext(c);\n    if (!authContext || authContext.userId !== userId) {\n      return c.json({ success: false, error: 'Forbidden' }, 403);\n    }\n\n    // Validate password"
);

fs.writeFileSync('src/worker/handlers/auth.ts', content);
