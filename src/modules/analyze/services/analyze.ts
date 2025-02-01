import { AnalyzeResponse } from '../types';

/**
 * 创建URL分析任务
 * @param urls 要分析的URL列表
 */
export async function createAnalyzeTask(
  urls: string[]
): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls }),
  });

  // 处理错误响应
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '请求失败');
  }

  // 解析并返回响应数据
  return response.json();
}
