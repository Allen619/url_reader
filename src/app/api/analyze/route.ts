import { NextRequest, NextResponse } from 'next/server';
import { queueManager } from '@/lib/queue';
import { z } from 'zod';

// 验证请求体的schema
const requestSchema = z.object({
  urls: z.array(z.string().url()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { urls } = requestSchema.parse(body);

    // 添加URL到队列
    const jobs = await queueManager.addJobs(urls);

    return NextResponse.json({
      success: true,
      message: `成功添加 ${jobs.length} 个URL到处理队列`,
      jobIds: jobs.map((job) => job.id),
    });
  } catch (error) {
    console.error('处理URL分析请求失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: '无效的请求数据',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: '处理请求失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          message: '缺少jobId参数',
        },
        { status: 400 }
      );
    }

    const job = await queueManager.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          message: '找不到指定的任务',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        data: job.data,
        status: await job.getState(),
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      },
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取任务状态失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
