import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { Document } from '@langchain/core/documents';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

export class WebContentLoader {
  private loader: CheerioWebBaseLoader;
  private url: string;

  constructor(url: string) {
    this.loader = new CheerioWebBaseLoader(url);
    this.url = url;
  }

  async load(): Promise<Document[]> {
    try {
      const docs = await this.loader.load();
      return docs;
    } catch (error) {
      console.error('Error loading web content:', error);
      throw new Error(
        `Failed to load content from URL: ${(error as Error).message}`
      );
    }
  }

  private cleanHtml(html: string): string {
    const $ = cheerio.load(html);

    // 移除所有脚本标签
    $('script').remove();
    // 移除所有样式标签
    $('style').remove();
    // 移除所有 iframe
    $('iframe').remove();
    // 移除注释
    $('*')
      .contents()
      .each(function () {
        if (this.type === 'comment') {
          $(this).remove();
        }
      });

    return $.html();
  }

  async loadAndClean(): Promise<string> {
    const docs = await this.load();
    if (!docs || docs.length === 0) {
      throw new Error('No content found');
    }

    // 先清理 HTML
    const cleanedHtml = this.cleanHtml(docs[0].pageContent);

    console.log('cleanedHtml', cleanedHtml);

    // 使用 Readability 处理
    const dom = new JSDOM(
      cleanedHtml
      //    {
      //   url: this.url,
      //   runScripts: 'outside-only',
      // }
    );

    const reader = new Readability(dom.window.document);

    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse content with Readability');
    }

    // console.log(article);

    return article.textContent;
  }
}
