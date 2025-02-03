import { UrlTask } from '@/types/queue';
import { createPage, updatePage, NotionPageProperties } from './notion';
import axios from 'axios';

/**
 * 处理单个URL任务
 */
export async function processUrl(task: UrlTask): Promise<void> {
  try {
    // 更新任务状态为处理中
    await updatePage(task.id, {
      status: 'processing',
      updatedAt: new Date(),
    });

    // 获取URL内容
    const response = await axios.get(task.url);
    const content = response.data;

    // TODO: 使用AI处理内容，提取关键信息和标签
    const processedContent = {
      title: '临时标题',
      content: content.slice(0, 1000), // 临时只取前1000字符
      tags: '临时标签',
    };

    // 创建Notion页面
    const properties: NotionPageProperties = {
      title: processedContent.title,
      url: task.url,
      content: processedContent.content,
      tags: processedContent.tags,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createPage(properties);
  } catch (error) {
    console.error('Error processing URL:', error);

    // 更新任务状态为失败
    await updatePage(task.id, {
      status: 'failed',
      error_msg: error instanceof Error ? error.message : '未知错误',
      updatedAt: new Date(),
    });

    throw error;
  }
}
