import { Client } from '@notionhq/client';
import {
  CreatePageResponse,
  UpdatePageResponse,
} from '@notionhq/client/build/src/api-endpoints';

if (!process.env.NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN is required');
}

if (!process.env.NOTION_DATABASE_ID) {
  throw new Error('NOTION_DATABASE_ID is required');
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

export type NotionPageResponse = CreatePageResponse | UpdatePageResponse;

export interface QueryDatabaseResponse {
  results: Array<{
    id: string;
    properties: Record<string, unknown>;
  }>;
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
): Promise<CreatePageResponse> {
  try {
    return await notion.pages.create({
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
): Promise<UpdatePageResponse> {
  try {
    return await notion.pages.update({
      page_id: formatNotionId(pageId),
      properties: convertPropertiesToNotion(properties),
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function queryPageByUrl(url: string) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'url',
        rich_text: {
          equals: url,
        },
      },
      page_size: 1,
    });

    return response.results[0] || null;
  } catch (error) {
    console.error('Error querying page by URL:', error);
    throw error;
  }
}
