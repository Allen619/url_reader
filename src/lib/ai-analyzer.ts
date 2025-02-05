import { PlaywrightLoader } from './loaders/playwrightLoader';
import { SummarizeChain, SummaryResult } from './chains/summarizeChain';

if (!process.env.OLLAMA_BASE_URL) {
  throw new Error('OLLAMA_BASE_URL is required');
}

if (!process.env.OLLAMA_MODEL) {
  throw new Error('OLLAMA_MODEL is required');
}

export class UrlAnalyzer {
  private contentLoader: PlaywrightLoader;
  private summarizeChain: SummarizeChain;

  constructor(url: string) {
    this.contentLoader = new PlaywrightLoader(url);
    this.summarizeChain = new SummarizeChain(
      process.env.OLLAMA_BASE_URL!,
      process.env.OLLAMA_MODEL!
    );
  }

  async analyze(): Promise<SummaryResult> {
    try {
      // 1. 加载网页内容
      console.log('Loading web content...');
      const content = await this.contentLoader.loadAndClean();

      // 2. 生成摘要
      console.log('Generating summary...');
      const summary = await this.summarizeChain.summarize(content);

      console.log('summary', summary);

      return summary;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`URL analysis failed: ${error.message}`);
      }
      throw new Error('URL analysis failed with an unknown error');
    }
  }
}

// 导出便捷函数
export async function analyzeUrl(url: string): Promise<SummaryResult> {
  const analyzer = new UrlAnalyzer(url);
  return analyzer.analyze();
}
