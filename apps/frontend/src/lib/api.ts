// Central API base URL — reads from env var, falls back to localhost for dev
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
