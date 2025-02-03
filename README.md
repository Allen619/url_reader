### Next.js + Ollama 内容分析

---

#### **一、项目概述**

**目标**：构建一个支持批量 URL 输入的 Web 应用，通过 Ollama 大模型提取内容核心信息，并自动生成标签存入 Notion 数据库。  
**技术栈**：

- **前端**：Next.js + Shadcn UI（美观的现代组件库）
- **后端**：Next.js API Routes + Bull Queue
- **AI 服务**：Ollama（本地或云服务器）
- **存储**：Redis + Notion Database
- **部署**：Docker Compose（统一部署）

---

#### **二、项目架构**

```bash
项目目录结构
├── app/
│   ├── api/                  # Next.js API路由
│   │   ├── tasks/           # 任务相关API
│   │   │   ├── create.ts    # 创建任务
│   ├── page.tsx             # 前端主页面
├── components/              # UI组件
│   ├── UrlInputForm.tsx     # URL输入表单
├── lib/
│   ├── notion.ts            # Notion客户端封装
│   ├── ollama.ts            # Ollama接口封装
│   ├── queue.ts             # Bull Queue配置
├── docker/
│   ├── ollama.Dockerfile    # Ollama容器配置
│   ├── redis.Dockerfile     # Redis容器配置
│   ├── docker-compose.yml   # 服务编排配置
```

##### **服务编排**：

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - REDIS_URL=redis://redis:6379
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - redis
      - ollama

  redis:
    image: redis:alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  ollama:
    build:
      context: .
      dockerfile: docker/ollama.Dockerfile
    ports:
      - '11434:11434'

volumes:
  redis_data:
```

---

#### **三、核心实现步骤**

##### **1. 队列系统设计**

```typescript
// lib/queue.ts
import Queue from 'bull';

// 创建队列
export const urlQueue = new Queue('url-processing', {
  redis: process.env.REDIS_URL,
});

// 处理器
urlQueue.process(async (job) => {
  const { url } = job.data;
  try {
    // 1. 抓取内容
    const content = await fetchContent(url);

    // 2. AI处理
    const result = await processWithAI(content);

    // 3. 更新Notion
    await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        URL: { url },
        Title: { title: [{ text: { content: result.title } }] },
        Content: { rich_text: [{ text: { content: result.content } }] },
        Tags: { multi_select: result.tags },
        Status: { select: { name: 'Success' } },
        CreatedAt: { date: { start: new Date().toISOString() } },
      },
    });
  } catch (error) {
    // 失败记录
    await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        title: {
          title: [{ text: { content: '失败记录' } }],
        },
        url: { url },
        status: { select: { name: 'Failed' } },
        error_msg: { rich_text: [{ text: { content: error.message } }] },
        createdAt: { date: { start: new Date().toISOString() } },
      },
    });
    throw error; // 让Bull处理重试
  }
});

// 配置重试策略
urlQueue.on('failed', async (job, err) => {
  if (job.attemptsMade < 3) {
    // 最多重试3次
    await job.retry();
  }
});
```

##### **2. API 路由实现**

```typescript
// app/api/tasks/create.ts
import { urlQueue } from '@/lib/queue';

export async function POST(req: Request) {
  const { urls } = await req.json();

  // 批量创建任务
  const jobs = await Promise.all(
    urls.map((url) =>
      urlQueue.add(
        { url },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // 初始延迟2秒
          },
        }
      )
    )
  );

  return Response.json({ message: 'Tasks created successfully' });
}
```

---

#### **六、扩展性设计**

- **已实现的扩展性**：
  ```markdown
  - 异步任务队列（Upstash Redis Queue）
    - 支持任务重试
    - 实时进度反馈
    - 处理超时保护
  ```

---

#### **七、最终产物**

1. **代码仓库**：GitHub 包含完整 Next.js 项目、Docker 配置。
2. **文档**：

   ```markdown
   ## 快速启动

   1. 复制 Notion 数据库模板
   2. 启动 Ollama 服务：`docker-compose up -d`
   3. 部署到 Vercel：`vercel deploy`
   ```

3. **演示地址**：Vercel Production URL + 临时 Ngrok 访问链接。
