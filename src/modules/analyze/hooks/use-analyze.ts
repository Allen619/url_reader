import { useRequest } from '@/hooks/use-request';
import { createAnalyzeTask } from '../services/analyze';
import { AnalyzeResponse } from '../types';

/**
 * URL分析任务Hook
 *
 * 用于创建批量URL内容分析任务，支持：
 * 1. 自动处理加载状态
 * 2. 错误重试
 * 3. 防抖
 */
export function useAnalyze() {
  const {
    loading,
    run: analyze,
    error,
    data,
  } = useRequest<AnalyzeResponse, [string[]]>(createAnalyzeTask, {
    manual: true, // 手动触发
    debounceWait: 300, // 防抖 300ms
    retryCount: 3, // 失败重试3次
    onError: (error) => {
      console.error('提交URL时出错:', error);
    },
  });

  return {
    analyze,
    isLoading: loading,
    error,
    data,
  };
}
