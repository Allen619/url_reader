import { Client } from '@notionhq/client';

if (!process.env.NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN is required');
}

if (!process.env.NOTION_DATABASE_ID) {
  throw new Error('NOTION_DATABASE_ID is required');
}

if (!process.env.NOTION_PROXY_URL) {
  throw new Error('NOTION_PROXY_URL is required');
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const databaseId = process.env.NOTION_DATABASE_ID;

// 格式化Notion ID为8-4-4-4-12格式
function formatNotionId(id: string): string {
  // 移除所有现有的破折号
  const cleanId = id.replace(/-/g, '');
  // 按8-4-4-4-12格式添加破折号
  return cleanId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

export interface NotionPageProperties {
  title: string;
  url?: string;
  content?: string;
  tags?: string;
  status?: string;
  error_msg?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotionPageResponse {
  id: string;
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
  url: string;
}

// 添加代理调用方法
async function proxyCall<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const response = await fetch(process.env.NOTION_PROXY_URL as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instance: {
        auth: process.env.NOTION_TOKEN,
      },
      method,
      params,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Proxy call failed');
  }

  return result.data;
}

// 转换properties为Notion API格式
function convertPropertiesToNotion(properties: Partial<NotionPageProperties>) {
  return {
    ...(properties.title && {
      title: {
        title: [{ text: { content: properties.title } }],
      },
    }),
    ...(properties.url && {
      url: {
        url: properties.url,
      },
    }),
    ...(properties.content && {
      content: {
        rich_text: [{ text: { content: properties.content.slice(0, 2000) } }],
      },
    }),
    ...(properties.tags && {
      tags: {
        rich_text: [{ text: { content: properties.tags } }],
      },
    }),
    ...(properties.status && {
      status: {
        select: {
          name: properties.status,
        },
      },
    }),
    ...(properties.error_msg && {
      error_msg: {
        rich_text: [{ text: { content: properties.error_msg } }],
      },
    }),
    ...(properties.createdAt && {
      createdAt: {
        date: {
          start: properties.createdAt.toISOString(),
        },
      },
    }),
    ...(properties.updatedAt && {
      updatedAt: {
        date: {
          start: properties.updatedAt.toISOString(),
        },
      },
    }),
  };
}

export async function createPage(
  properties: NotionPageProperties
): Promise<NotionPageResponse> {
  try {
    return await proxyCall('pages.create', {
      parent: {
        database_id: databaseId,
      },
      properties: convertPropertiesToNotion(properties),
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function updatePage(
  pageId: string,
  properties: Partial<NotionPageProperties>
): Promise<NotionPageResponse> {
  try {
    return await proxyCall('pages.update', {
      page_id: formatNotionId(pageId),
      properties: convertPropertiesToNotion(properties),
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
