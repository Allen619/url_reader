import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { queueManager } from '@/lib/queue';
import { nanoid } from 'nanoid';

// URL 验证正则表达式
const URL_REGEX =
  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?[^#]*)?(#.*)?$/i;

// 请求体验证 Schema
const requestSchema = z.object({
  urls: z
    .array(
      z
        .string()
        .min(1, '请输入URL')
        .transform((url) => {
          try {
            // 尝试解码 URL（如果已编码）
            return decodeURIComponent(url);
          } catch {
            // 如果解码失败，说明可能未编码，直接返回原始值
            return url;
          }
        })
        .refine((url) => URL_REGEX.test(url), {
          message: '无效的URL格式',
        })
    )
    .min(1, '至少需要一个URL')
    .max(10, '每次最多处理10个URL'),
});

// 生成唯一URL ID
function generateUrlId() {
  return `url_${nanoid(10)}`;
}

/**
 * POST /api/analyze
 * 创建 URL 分析任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = requestSchema.parse(body);

    // 为每个URL创建独立任务
    const tasks = await Promise.all(
      urls.map(async (url) => {
        const urlId = generateUrlId();
        return await queueManager.addUrl(urlId, url);
      })
    );

    return NextResponse.json({
      message: '任务创建成功',
      tasks: tasks.map((task) => ({
        urlId: task.id,
        url: task.url,
        status: task.status,
      })),
    });
  } catch (error: unknown) {
    console.error('创建分析任务失败:', error);

    // 处理验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: '请求参数错误',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // 处理其他错误
    return NextResponse.json(
      {
        message: '服务器内部错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * 获取URL任务状态
 */
export async function GET(request: NextRequest) {
  try {
    const urlId = request.nextUrl.searchParams.get('urlId');

    if (!urlId) {
      return NextResponse.json(
        {
          message: '缺少URL ID',
        },
        { status: 400 }
      );
    }

    const task = await queueManager.getUrlTask(urlId);

    if (!task) {
      return NextResponse.json(
        {
          message: '任务不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      urlId: task.id,
      url: task.url,
      status: task.status,
      content: task.content,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error: unknown) {
    console.error('获取任务状态失败:', error);

    return NextResponse.json(
      {
        message: '服务器内部错误',
      },
      { status: 500 }
    );
  }
}
