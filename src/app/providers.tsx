'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  // 创建持久化的查询客户端实例
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,                    // 失败重试1次
        refetchOnWindowFocus: false, // 禁用窗口焦点重新获取
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {/* 仅在开发环境显示调试工具 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}