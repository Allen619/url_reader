import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash-es';

interface RequestOptions<TData, TParams extends unknown[]> {
  // 是否手动触发
  manual?: boolean;
  // 防抖等待时间
  debounceWait?: number;
  // 错误重试次数
  retryCount?: number;
  // 成功回调
  onSuccess?: (data: TData, params: TParams) => void;
  // 错误回调
  onError?: (error: Error, params: TParams) => void;
}

interface RequestResult<TData, TParams extends unknown[]> {
  // 数据
  data?: TData;
  // 错误
  error?: Error;
  // 加载状态
  loading: boolean;
  // 执行请求的函数
  run: (...params: TParams) => Promise<TData>;
}

/**
 * 通用的请求 Hook
 * @param service 请求函数
 * @param options 配置选项
 */
export function useRequest<TData, TParams extends unknown[]>(
  service: (...args: TParams) => Promise<TData>,
  options: RequestOptions<TData, TParams> = {}
): RequestResult<TData, TParams> {
  const {
    manual = true,
    debounceWait = 0,
    retryCount = 0,
    onSuccess,
    onError,
  } = options;

  // 状态管理
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(!manual);

  // 重试计数器
  const retryCountRef = useRef(0);

  // 实际的请求函数
  const runRequest = useCallback(
    async (...params: TParams) => {
      setLoading(true);
      setError(undefined);

      try {
        const result = await service(...params);
        setData(result);
        onSuccess?.(result, params);
        return result;
      } catch (err) {
        // 处理错误重试
        if (retryCountRef.current < retryCount) {
          retryCountRef.current += 1;
          return runRequest(...params);
        }

        // 重置重试计数器
        retryCountRef.current = 0;

        // 处理错误
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error, params);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [service, retryCount, onSuccess, onError]
  );

  // 添加防抖
  const run = useCallback(
    (...params: TParams): Promise<TData> => {
      if (debounceWait > 0) {
        return new Promise((resolve, reject) => {
          const debouncedFn = debounce(async () => {
            try {
              const result = await runRequest(...params);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, debounceWait);
          debouncedFn();
        });
      }
      return runRequest(...params);
    },
    [runRequest, debounceWait]
  );

  return {
    data,
    error,
    loading,
    run,
  };
}
