import { Hono } from 'hono';

const app = new Hono();
const myMiddleware = async (c: any, next: any) => {
  await next();
}
app.get('/test', myMiddleware, (c) => c.text('ok'));
console.log('Valid syntax');
