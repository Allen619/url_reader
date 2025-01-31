'use client';

import { FC } from 'react';
import UrlInputForm from './forms/url-input-form';

const UrlAnalyzer: FC = () => {
  const handleSubmit = (urls: string[]) => {
    console.log('提交的URLs:', urls);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">批量URL内容分析</h2>
        <p className="text-muted-foreground">
          输入多个URL，自动提取核心内容并存入Notion
        </p>
      </div>

      <UrlInputForm onSubmit={handleSubmit} />
    </div>
  );
};

export default UrlAnalyzer; 