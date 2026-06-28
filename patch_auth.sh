sed -i 's/import { Context } from '\''hono'\'';/import { Context } from '\''hono'\'';\nimport { getAuthContext } from '\''.\/middleware\/auth-middleware'\'';/' src/worker/handlers/auth.ts
