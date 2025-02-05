import { UrlTask } from '@/types/queue';
import { createPage, updatePage, NotionPageProperties } from './notion';
import { analyzeUrl } from './ai-analyzer';
import { queryPageByUrl } from './notion';

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

    // 使用 AI 分析器处理 URL 内容
    const processedContent = await analyzeUrl(task.url);
    console.log('processedContent', processedContent);

    // 检查URL是否已存在
    const existingPage = await queryPageByUrl(task.url);

    const properties: NotionPageProperties = {
      title: processedContent.title,
      url: task.url,
      content: `${processedContent.content}`,
      tags: processedContent.tags.join(', '),
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingPage) {
      // 如果页面存在，更新它
      await updatePage(existingPage.id, properties);
    } else {
      // 如果是新页面，创建它
      await createPage(properties);
    }
  } catch (error) {
    console.error('Error processing URL:', error);

    // 更新任务状态为失败
    await updatePage(task.id, {
      status: 'failed',
      content: '失败',
      error_msg: error instanceof Error ? error.message : '未知错误',
      updatedAt: new Date(),
    });

    throw error;
  }
}
