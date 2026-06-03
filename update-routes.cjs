const fs = require('fs');
let content = fs.readFileSync('src/worker/routes/auth-routes.ts', 'utf8');

content = content.replace(
  "import { corsOriginResolver } from '../utils/cors-resolver';",
  "import { corsOriginResolver } from '../utils/cors-resolver';\nimport { requireAuth } from '../middleware/auth-middleware';"
);

content = content.replace("authApi.post('/verify', verifyTokenHandler);", "authApi.post('/verify', requireAuth, verifyTokenHandler);");
content = content.replace("authApi.get('/profile/:userId', getUserProfileHandler);", "authApi.get('/profile/:userId', requireAuth, getUserProfileHandler);");
content = content.replace("authApi.put('/profile/:userId', updateUserProfileHandler);", "authApi.put('/profile/:userId', requireAuth, updateUserProfileHandler);");
content = content.replace("authApi.post('/change-password/:userId', changePasswordHandler);", "authApi.post('/change-password/:userId', requireAuth, changePasswordHandler);");
content = content.replace("authApi.post('/logout', logoutHandler);", "authApi.post('/logout', requireAuth, logoutHandler);");

fs.writeFileSync('src/worker/routes/auth-routes.ts', content);
