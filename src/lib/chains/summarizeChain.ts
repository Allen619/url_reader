import { Ollama } from '@langchain/ollama';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

export const SummarySchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  tags: z.array(z.string()).min(3).max(5),
});

export type SummaryResult = z.infer<typeof SummarySchema>;

export class SummarizeChain {
  private model: Ollama;
  private baseUrl: string;
  private language: string;
  private parser: StructuredOutputParser<typeof SummarySchema>;

  constructor(baseUrl: string, modelName: string) {
    this.baseUrl = baseUrl;
    this.model = new Ollama({
      baseUrl: baseUrl,
      model: modelName,
      temperature: 0.1,
    });
    this.language = process.env.RESPONSE_LANGUAGE || 'zh-CN';
    this.parser = StructuredOutputParser.fromZodSchema(SummarySchema);
  }

  private cleanJsonString(str: string): string {
    // 移除不可打印字符，但保留换行和空格
    return str.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  }

  async summarize(content: string): Promise<SummaryResult> {
    try {
      const prompt =
        PromptTemplate.fromTemplate(`分析以下文章内容，并提取关键信息。

文章内容：
{content}

请生成以下内容：
1. 一个简洁但信息丰富的标题
2. 不超过1000字的详细摘要，包含主要论点和关键细节
3. 3-5个关键词标签
4. 主体语言请使用${this.language}回复。

{format_instructions}`);

      const formatInstructions = this.parser.getFormatInstructions();

      const formattedPrompt = await prompt.format({
        content,
        format_instructions: formatInstructions,
      });

      console.log('Sending request to Ollama...', Date.now());
      const response = await this.model.invoke(formattedPrompt);
      console.log('Raw response:', response);

      // 清理响应文本中的非法字符
      const cleanedResponse = this.cleanJsonString(
        typeof response === 'string' ? response : JSON.stringify(response)
      );
      console.log('Cleaned response:', cleanedResponse);

      // 使用 parser 解析响应
      const result = await this.parser.parse(cleanedResponse);
      console.log('Parsed result:', result);

      return result;
    } catch (error: unknown) {
      console.error('Summarization error:', error);
      if (error instanceof Error) {
        throw new Error(`Summarization failed: ${error.message}`);
      }
      throw new Error('Summarization failed with an unknown error');
    }
  }
}
