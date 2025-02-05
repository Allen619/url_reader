import http from 'http';
import { Client } from '@notionhq/client';
import { SummarizeChain } from '../lib/chains/summarizeChain';

interface NotionRequest {
  instance: {
    auth: string;
  };
  method: string;
  params?: Record<string, unknown>;
}

interface OllamaRequest {
  content: string;
  baseUrl: string;
  modelName: string;
}

const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // 读取请求体
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const path = url.pathname;

      // Notion API 处理
      if (path === '/notion') {
        const { instance, method, params } = data as NotionRequest;

        if (!instance?.auth || !method) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: 'Both instance (with auth) and method are required',
              request: data,
            })
          );
          return;
        }

        try {
          const notionClient = new Client({
            auth: instance.auth,
          });

          const methodPath = method.split('.');
          let currentObj: any = notionClient;

          for (const path of methodPath) {
            currentObj = currentObj[path];
          }

          if (typeof currentObj !== 'function') {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error: 'Invalid method path',
                method: method,
              })
            );
            return;
          }

          const result = await currentObj.call(notionClient, params || {});
          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              data: result,
            })
          );
        } catch (error) {
          const err = error as Error;
          res.writeHead(500);
          res.end(
            JSON.stringify({
              error: err.message,
              stack: err.stack,
            })
          );
        }
      }
      // Ollama API 处理
      else if (path === '/ollama') {
        const { content, baseUrl, modelName } = data as OllamaRequest;

        if (!content || !baseUrl || !modelName) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: 'Content, baseUrl, and modelName are required',
              request: data,
            })
          );
          return;
        }

        try {
          const summarizeChain = new SummarizeChain(baseUrl, modelName);
          const result = await summarizeChain.summarize(content);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              data: result,
            })
          );
        } catch (error) {
          const err = error as Error;
          res.writeHead(500);
          res.end(
            JSON.stringify({
              error: err.message,
              stack: err.stack,
            })
          );
        }
      } else {
        res.writeHead(404);
        res.end(
          JSON.stringify({
            error: 'Invalid endpoint',
            path: path,
          })
        );
      }
    } catch (error) {
      const parseErr = error as Error;
      res.writeHead(400);
      res.end(
        JSON.stringify({
          error: 'Invalid JSON payload',
          details: parseErr.message,
        })
      );
    }
  });
});

const PORT = process.env.PORT || 3017;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
