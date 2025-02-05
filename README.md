# URL Reader

一个强大的网页内容分析工具，能够自动读取、分析和总结网页内容，并支持将内容智能分类整理到 Notion 数据库中。

## 功能特性

- 🌐 智能网页内容抓取
- 🤖 基于 AI 的内容分析和总结
- 📝 支持 Notion 集成
- 🚀 异步任务队列处理
- 💻 现代化 Web 界面

## 技术栈

- **前端框架**: Next.js 15.1, React 19
- **UI 组件**:
  - Tailwind CSS
  - Radix UI
- **后端技术**:
  - Playwright (网页内容抓取)
  - LangChain (AI 处理)
  - BullMQ (任务队列)
  - Redis (缓存与队列)
- **AI 模型**:
  - Ollama
  - 支持自定义 AI 模型配置

## 环境要求

- Node.js >= 18
- Redis 服务器
- Ollama 服务

## 环境变量配置

参考 `.env.example` 文件配置

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 安装 Playwright 依赖

```bash
npm run prebuild
```

3. 启动开发服务器

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

5. 启动生产服务器

```bash
npm run start
```

## 主要功能模块

- `src/lib/ai-analyzer.ts`: AI 分析核心模块
- `src/lib/loaders/`: 网页内容加载器
- `src/lib/chains/`: AI 处理链
- `src/server/`: 服务器端 API 实现
- `src/components/`: UI 组件
- `src/modules/`: 业务模块

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
