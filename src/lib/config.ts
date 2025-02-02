import { QueueConfig } from '@/types/queue';
import { RedisOptions } from 'ioredis';

// Redis 配置
export const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// 任务配置
export const taskConfig: QueueConfig = {
  maxAttempts: 3,
  retryDelay: 5000,
  expireTime: 60 * 60 * 24, // 24小时
  concurrency: 1,
};
