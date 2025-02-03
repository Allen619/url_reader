export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UrlTask {
  id: string;
  url: string;
  status: TaskStatus;
  tags: string;
  content?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskContent {
  title: string;
  description: string;
  wordCount: number;
  fileName: string;
}

export interface JobData {
  url: string;
  notionPageId?: string;
}

export interface QueueConfig {
  maxAttempts: number;
  retryDelay: number;
  expireTime: number;
  concurrency: number;
}
