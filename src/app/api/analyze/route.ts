import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const tasks = urls.map((url: string) => ({
      url,
      status: 'pending' as const,
    }));

    console.log('tasks', tasks);

    // TODO: 将任务保存到数据库或队列系统中
    // 这里先模拟异步处理

    // 返回任务信息
    return NextResponse.json({
      taskId,
      message: '任务创建成功',
      tasks,
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
