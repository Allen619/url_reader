/**
 * API响应数据接口定义
 */
export interface AnalyzeResponse {
  /** 任务唯一标识 */
  taskId: string;
  message: string;
  tasks: {
    url: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }[];
}
