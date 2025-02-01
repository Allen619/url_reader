import { RedisOptions } from 'ioredis';

// Redis 配置
export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10),
  maxRetriesPerRequest: null,
};

// 任务配置
export const taskConfig = {
  maxAttempts: parseInt(process.env.TASK_MAX_ATTEMPTS, 10),
  retryDelay: parseInt(process.env.TASK_RETRY_DELAY, 10),
  expireTime: parseInt(process.env.TASK_EXPIRE_TIME, 10),
};
