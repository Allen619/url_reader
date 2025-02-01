import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { redisConfig, taskConfig } from './config';
import { processUrl } from './processor';

// 添加调试日志
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

export interface TaskResult {
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content?: string;
  error?: string;
}

export interface Task {
  id: string;
  urls: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: TaskResult[];
  createdAt: Date;
  updatedAt: Date;
}

interface JobData {
  taskId: string;
  urls: string[];
}

interface JobResult {
  results: TaskResult[];
}

const QUEUE_NAME = 'url-analyzer';

class QueueManager {
  private queue: Queue<JobData>;
  private worker: Worker<JobData, JobResult>;
  private events: QueueEvents;
  private redis: IORedis;
  private static instance: QueueManager;

  private constructor() {
    // 创建 Redis 客户端
    this.redis = new IORedis(redisConfig);

    // 创建队列
    this.queue = new Queue<JobData>(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: taskConfig.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: taskConfig.retryDelay,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // 创建工作进程
    this.worker = new Worker<JobData, JobResult>(
      QUEUE_NAME,
      async (job: Job<JobData>) => {
        const { urls } = job.data;
        console.log('Processing job:', job.id, 'URLs:', urls);

        const results = await Promise.all(
          urls.map(async (url: string) => {
            const result: TaskResult = {
              url,
              status: 'pending',
            };
            try {
              await processUrl(result);
            } catch (error) {
              console.error('Error processing URL:', url, error);
            }
            return result;
          })
        );

        // 更新任务状态
        const task = await this.getTask(job.id as string);
        if (task) {
          task.results = results;
          task.status = results.every((r) => r.status === 'completed')
            ? 'completed'
            : 'failed';
          task.updatedAt = new Date();

          await this.redis.set(
            `task:${job.id}`,
            JSON.stringify(task),
            'EX',
            taskConfig.expireTime
          );
        }

        return { results };
      },
      {
        connection: redisConfig,
        concurrency: 1,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      }
    );

    // 创建事件监听器
    this.events = new QueueEvents(QUEUE_NAME, {
      connection: redisConfig,
    });

    // 错误处理
    this.worker.on('error', (err: Error) => {
      console.error('Worker error:', err);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error('Job failed:', job?.id, err);
    });

    this.events.on(
      'completed',
      ({ jobId, returnvalue }: { jobId: string; returnvalue: string }) => {
        console.log('Job completed:', jobId, returnvalue);
      }
    );

    this.events.on(
      'failed',
      ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
        console.error('Job failed:', jobId, failedReason);
      }
    );
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  // 添加新任务
  public async addTask(taskId: string, urls: string[]): Promise<Task> {
    const task: Task = {
      id: taskId,
      urls,
      status: 'pending',
      results: urls.map((url) => ({
        url,
        status: 'pending',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 保存任务信息到 Redis
    await this.redis.set(
      `task:${taskId}`,
      JSON.stringify(task),
      'EX',
      taskConfig.expireTime
    );

    // 添加到队列
    await this.queue.add(
      'analyze',
      {
        taskId,
        urls,
      },
      {
        jobId: taskId,
      }
    );

    return task;
  }

  // 获取任务状态
  public async getTask(taskId: string): Promise<Task | null> {
    const taskData = await this.redis.get(`task:${taskId}`);
    if (!taskData) return null;

    return JSON.parse(taskData);
  }

  // 关闭连接
  public async close() {
    await this.queue.close();
    await this.worker.close();
    await this.events.close();
    await this.redis.quit();
  }
}

export const queueManager = QueueManager.getInstance();
