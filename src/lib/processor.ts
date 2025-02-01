import fs from 'fs/promises';
import path from 'path';
import { TaskResult } from './queue';

// 处理单个URL
export async function processUrl(result: TaskResult) {
  try {
    // 模拟处理延迟
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 3000)
    );

    // 确保存储目录存在
    const storageDir = path.join(process.cwd(), 'storage');
    await fs.mkdir(storageDir, { recursive: true });

    // 生成模拟数据
    const mockData = {
      url: result.url,
      title: `${result.url} 的标题`,
      description: `这是 ${result.url} 的描述`,
      keywords: ['关键词1', '关键词2', '关键词3'],
      content: `这是 ${result.url} 的主要内容。\n这是第二行内容。\n这是第三行内容。`,
      metadata: {
        author: '作者名称',
        publishDate: new Date().toISOString(),
        wordCount: Math.floor(Math.random() * 1000) + 500,
        readingTime: Math.floor(Math.random() * 10) + 5,
      },
      images: [
        {
          url: 'https://example.com/image1.jpg',
          alt: '图片1描述',
        },
        {
          url: 'https://example.com/image2.jpg',
          alt: '图片2描述',
        },
      ],
      timestamp: new Date().toISOString(),
    };

    // 将数据写入文件
    const fileName =
      Buffer.from(result.url).toString('base64').replace(/[/+=]/g, '_') +
      '.json';
    await fs.writeFile(
      path.join(storageDir, fileName),
      JSON.stringify(mockData, null, 2),
      'utf-8'
    );

    // 更新结果
    result.content = JSON.stringify({
      title: mockData.title,
      description: mockData.description,
      wordCount: mockData.metadata.wordCount,
      fileName,
    });

    result.status = 'completed';
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : '处理失败';
    throw error;
  }
}
