import { Context, Next } from 'hono';
import { supabase } from '../lib/supabase';

export async function authMiddleware(c: Context, next: Next) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables missing. Bypassing auth check.');
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Unauthorized: Invalid Supabase token' }, 401);
  }

  // Store user in context
  c.set('user', user);
  await next();
}
