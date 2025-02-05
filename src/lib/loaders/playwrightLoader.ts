import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { chromium } from 'playwright';

export interface ArticleContent {
  title: string;
  content: string;
  excerpt: string;
}

export class PlaywrightLoader {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private async load(): Promise<string> {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(this.url, { waitUntil: 'networkidle' });
      const content = await page.content();
      return content;
    } catch (error) {
      console.error('Error loading web content:', error);
      throw new Error(
        `Failed to load content from URL: ${(error as Error).message}`
      );
    } finally {
      await browser.close();
    }
  }

  async loadAndClean(): Promise<string> {
    const html = await this.load();
    if (!html) {
      throw new Error('No content found');
    }

    // 使用 Readability 处理
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse content with Readability');
    }

    return article.textContent;
  }
}
