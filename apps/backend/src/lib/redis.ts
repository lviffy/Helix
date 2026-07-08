import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL) {
  console.warn('⚠️ REDIS_URL not set, using default: redis://localhost:6379');
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.error('🔴 Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('🔌 Redis connected successfully');
});
