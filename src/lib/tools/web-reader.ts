import { SerpAPI } from '@langchain/community/tools/serpapi';

if (!process.env.SERPAPI_API_KEY) {
  throw new Error('SERPAPI_API_KEY is required');
}

/**
 * 使用 SerpAPI 获取指定 URL 的搜索结果内容
 */
export async function readWebContent(url: string): Promise<string> {
  const serpApi = new SerpAPI(process.env.SERPAPI_API_KEY, {
    hl: 'zh-cn',
    gl: 'cn',
  });

  const result = await serpApi.invoke({ input: `site:${url}` });
  return result;
}
