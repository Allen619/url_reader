'use client';

import { FC } from 'react';
import UrlInputForm from './url-input-form';
import { useAnalyze } from '../hooks/use-analyze';
import { toast } from 'sonner';

// URL批量分析组件
const UrlAnalyzer: FC = () => {
  const { analyze, isLoading } = useAnalyze();

  // 处理URL提交
  const handleSubmit = async (urls: string[]) => {
    try {
      const data = await analyze(urls);
      console.log('分析任务创建成功:', data);
      toast.success('任务创建成功');
      // TODO: 添加任务状态展示
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建任务失败');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">批量URL内容分析</h2>
        <p className="text-muted-foreground">
          输入多个URL，自动提取核心内容并存入Notion
        </p>
      </div>

      <UrlInputForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};

export default UrlAnalyzer; 