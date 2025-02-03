import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { redisConfig } from './config';
import { processUrl } from './processor';
import { UrlTask } from '@/types/queue';
import { createPage, updatePage, NotionPageResponse } from './notion';

const QUEUE_NAME = 'url-analyzer';

class QueueManager {
  private static instance: QueueManager;
  private queue: Queue;
  private worker: Worker;
  private events: QueueEvents;
  private redis: IORedis;

  private constructor() {
    this.redis = new IORedis(redisConfig);

    // 初始化队列
    this.queue = new Queue(QUEUE_NAME, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: Number(process.env.TASK_MAX_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: Number(process.env.TASK_RETRY_DELAY || '5000'),
        },
      },
    });

    // 初始化工作进程
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { url } = job.data;

        // 创建初始Notion页面并获取页面ID
        const notionPage: NotionPageResponse = await createPage({
          title: url,
          url: url,
          content: '正在处理中...',
          status: 'pending',
          tags: '-',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // 创建任务对象
        const task: UrlTask = {
          id: notionPage.id,
          url,
          status: 'pending',
          tags: '-',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 保存Notion页面ID到任务数据中
        job.updateData({
          ...job.data,
          notionPageId: notionPage.id,
        });

        // 处理URL
        await processUrl(task);

        return task;
      },
      {
        connection: redisConfig,
        concurrency: 1,
      }
    );

    // 初始化事件监听
    this.events = new QueueEvents(QUEUE_NAME, {
      connection: redisConfig,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.worker.on('completed', async (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', async (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);

      if (job?.data?.notionPageId) {
        await updatePage(job.data.notionPageId, {
          status: 'failed',
          error_msg: error.message,
        });
      }
    });

    this.events.on('waiting', ({ jobId }) => {
      console.log(`Job ${jobId} is waiting`);
    });

    this.events.on('active', ({ jobId }) => {
      console.log(`Job ${jobId} has started`);
    });
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public async addJob(url: string) {
    return await this.queue.add('analyze-url', { url });
  }

  public async addJobs(urls: string[]) {
    const jobs = urls.map((url) => ({
      name: 'analyze-url',
      data: { url },
    }));
    return await this.queue.addBulk(jobs);
  }

  public async getJob(jobId: string) {
    return await this.queue.getJob(jobId);
  }

  public async close() {
    await this.queue.close();
    await this.worker.close();
    await this.events.close();
    await this.redis.quit();
  }
}

export const queueManager = QueueManager.getInstance();
