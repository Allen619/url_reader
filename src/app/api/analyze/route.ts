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

// 生成唯一任务 ID
function generateTaskId() {
  return `task_${nanoid(10)}`;
}

/**
 * POST /api/analyze
 * 创建 URL 分析任务
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const { urls } = requestSchema.parse(body);

    // 创建任务
    const taskId = generateTaskId();
    const task = await queueManager.addTask(taskId, urls);

    // 返回任务信息
    return NextResponse.json({
      taskId: task.id,
      message: '任务创建成功',
      status: task.status,
      results: task.results,
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
 * 获取任务状态
 */
export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        {
          message: '缺少任务ID',
        },
        { status: 400 }
      );
    }

    const task = await queueManager.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        {
          message: '任务不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      results: task.results,
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
