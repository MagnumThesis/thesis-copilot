import { Hono, Context, Next } from 'hono';
const app = new Hono();
const requireAuth = async (c: Context, next: Next) => await next();
const handler = async (c: Context) => c.text('ok');
app.get('/test', requireAuth, handler);
