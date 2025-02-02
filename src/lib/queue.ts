import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';
import { redisConfig, taskConfig } from './config';
import { processUrl } from './processor';
import { JobData, TaskContent, UrlTask } from '@/types/queue';

const QUEUE_NAME = 'url-analyzer';

interface SerializedUrlTask extends Omit<UrlTask, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

class QueueManager {
  private queue: Queue<JobData>;
  private worker: Worker<JobData, SerializedUrlTask>;
  private events: QueueEvents;
  private redis: IORedis;
  private static instance: QueueManager;

  private constructor() {
    this.redis = new IORedis(redisConfig);

    // 初始化队列
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

    // 初始化worker
    this.worker = new Worker<JobData, SerializedUrlTask>(
      QUEUE_NAME,
      async (job: Job<JobData>) => {
        try {
          const { url, urlId } = job.data;
          if (!url || !urlId) {
            throw new Error('无效的任务数据：缺少URL或URL ID');
          }

          console.log('开始处理URL任务:', { url, urlId });

          // 获取或创建任务
          let urlTask = await this.getOrCreateTask(urlId, url);

          // 更新状态为处理中
          urlTask = await this.updateTaskStatus(urlTask, 'processing');

          // 处理URL
          await processUrl(urlTask);

          // 更新状态为完成
          urlTask = await this.updateTaskStatus(urlTask, 'completed');

          // 返回序列化的任务数据
          return this.serializeTask(urlTask);
        } catch (error) {
          const urlTask = await this.handleProcessingError(job.data, error);
          return this.serializeTask(urlTask);
        }
      },
      {
        connection: redisConfig,
        concurrency: taskConfig.concurrency,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      }
    );

    // 初始化事件监听
    this.events = new QueueEvents(QUEUE_NAME, {
      connection: redisConfig,
    });

    this.setupEventListeners();
  }

  private serializeTask(task: UrlTask): SerializedUrlTask {
    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private deserializeTask(serialized: SerializedUrlTask): UrlTask {
    return {
      ...serialized,
      createdAt: new Date(serialized.createdAt),
      updatedAt: new Date(serialized.updatedAt),
    };
  }

  private setupEventListeners() {
    // Worker错误处理
    this.worker.on('error', (err: Error) => {
      console.error('Worker错误:', err);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error('任务执行失败:', job?.id, err);
    });

    // 任务完成事件
    this.events.on('completed', ({ jobId, returnvalue }) => {
      try {
        // returnvalue 已经是序列化的任务数据
        const serializedTask = returnvalue as unknown as SerializedUrlTask;
        const task = this.deserializeTask(serializedTask);

        // 解析content字段（如果存在）
        let content: TaskContent | undefined;
        if (task.content) {
          try {
            content = JSON.parse(task.content);
          } catch (e) {
            console.warn('解析content失败:', e);
          }
        }

        console.log('任务完成:', {
          jobId,
          url: task.url,
          status: task.status,
          title: content?.title,
          wordCount: content?.wordCount,
          updatedAt: task.updatedAt.toISOString(),
        });
      } catch (error) {
        console.error('处理完成事件失败:', error);
        if (typeof returnvalue === 'object') {
          console.error('原始返回值:', JSON.stringify(returnvalue, null, 2));
        } else {
          console.error('原始返回值:', returnvalue);
        }
      }
    });

    // 任务失败事件
    this.events.on('failed', ({ jobId, failedReason }) => {
      console.error('任务失败:', jobId, failedReason);
    });
  }

  private async getOrCreateTask(urlId: string, url: string): Promise<UrlTask> {
    const existingTask = await this.redis.get(`url:${urlId}`);
    if (existingTask) {
      const serialized = JSON.parse(existingTask) as SerializedUrlTask;
      return this.deserializeTask(serialized);
    }

    return {
      id: urlId,
      url,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async updateTaskStatus(
    task: UrlTask,
    status: UrlTask['status']
  ): Promise<UrlTask> {
    const updatedTask = {
      ...task,
      status,
      updatedAt: new Date(),
    };

    const serialized = this.serializeTask(updatedTask);
    await this.redis.set(
      `url:${task.id}`,
      JSON.stringify(serialized),
      'EX',
      taskConfig.expireTime
    );

    return updatedTask;
  }

  private async handleProcessingError(
    jobData: JobData,
    error: unknown
  ): Promise<UrlTask> {
    console.error('URL处理失败:', jobData, error);

    const urlTask: UrlTask = {
      id: jobData.urlId,
      url: jobData.url,
      status: 'failed',
      error: error instanceof Error ? error.message : '处理失败',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const serialized = this.serializeTask(urlTask);
    await this.redis.set(
      `url:${jobData.urlId}`,
      JSON.stringify(serialized),
      'EX',
      taskConfig.expireTime
    );

    return urlTask;
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public async addUrl(urlId: string, url: string): Promise<UrlTask> {
    if (!url || !urlId) {
      throw new Error('URL和URL ID都是必需的');
    }

    // 创建初始任务
    const urlTask = await this.getOrCreateTask(urlId, url);
    await this.updateTaskStatus(urlTask, 'pending');

    try {
      // 添加到队列
      const job = await this.queue.add(
        'analyze',
        { urlId, url },
        {
          jobId: urlId,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      console.log('URL已添加到队列:', url, 'Job ID:', job.id);
      return urlTask;
    } catch (error) {
      console.error('添加任务到队列失败:', error);
      throw error;
    }
  }

  public async getUrlTask(urlId: string): Promise<UrlTask | null> {
    try {
      const taskData = await this.redis.get(`url:${urlId}`);
      if (!taskData) return null;

      const serialized = JSON.parse(taskData) as SerializedUrlTask;
      return this.deserializeTask(serialized);
    } catch (error) {
      console.error('获取URL任务失败:', error);
      return null;
    }
  }

  public async close() {
    await this.queue.close();
    await this.worker.close();
    await this.events.close();
    await this.redis.quit();
  }
}

export const queueManager = QueueManager.getInstance();
