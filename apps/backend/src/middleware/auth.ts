import { Context, Next } from 'hono';
import { supabase } from '../lib/supabase';

export async function authMiddleware(c: Context, next: Next) {
  // If Supabase is not configured, skip auth entirely
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables missing. Bypassing auth check.');
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');

  // No auth header at all — allow through (wallet address is used as identity in the request body/query)
  // The app is wallet-address-centric; Supabase auth is additive telemetry, not a gate.
  if (!authHeader) {
    await next();
    return;
  }

  // If a Bearer token IS provided, validate it
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return c.json({ error: 'Unauthorized: Invalid Supabase token' }, 401);
      }
      c.set('user', user);
    } catch (err: any) {
      // Supabase unreachable — log and continue rather than blocking the request
      console.error('⚠️ Auth middleware: Supabase getUser failed, continuing without user context:', err?.message);
    }
  }

  await next();
}
