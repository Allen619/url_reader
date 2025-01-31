'use client';

import { FC, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Plus, Split } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import UrlInputItem from './url-input-item'
import { AnimatePresence, motion } from 'framer-motion'

interface UrlInputFormProps {
  onSubmit: (urls: string[]) => void
}

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

const UrlInputForm: FC<UrlInputFormProps> = ({ onSubmit }) => {
  const [urls, setUrls] = useState<string[]>([''])
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [open, setOpen] = useState(false)
  const [textareaValue, setTextareaValue] = useState('')

  const addUrl = () => {
    setUrls([...urls, ''])
  }

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      // 创建新的 urls 数组，排除要删除的索引
      const newUrls = urls.filter((_, i) => i !== index)
      setUrls(newUrls)

      // 重新调整错误对象的索引
      const newErrors: Record<number, string> = {}
      Object.entries(errors).forEach(([key, value]) => {
        const errorIndex = parseInt(key)
        if (errorIndex < index) {
          newErrors[errorIndex] = value
        } else if (errorIndex > index) {
          newErrors[errorIndex - 1] = value
        }
      })
      setErrors(newErrors)
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)

    // 验证
    const newErrors = { ...errors }
    if (!value) {
      newErrors[index] = 'URL不能为空'
    } else if (!URL_REGEX.test(value)) {
      newErrors[index] = 'URL格式不正确'
    } else {
      delete newErrors[index]
    }
    setErrors(newErrors)
  }

  const handleSubmit = () => {
    // 验证所有URL
    const newErrors: Record<number, string> = {}
    urls.forEach((url, index) => {
      if (!url) {
        newErrors[index] = 'URL不能为空'
      } else if (!URL_REGEX.test(url)) {
        newErrors[index] = 'URL格式不正确'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(urls.filter(url => url.length > 0))
  }

  // 验证单个URL
  const validateUrl = (url: string): string | null => {
    if (!url) {
      return 'URL不能为空'
    } else if (!URL_REGEX.test(url)) {
      return 'URL格式不正确'
    }
    return null
  }

  // 验证所有URL
  const validateUrls = (urlList: string[]): Record<number, string> => {
    const newErrors: Record<number, string> = {}
    urlList.forEach((url, index) => {
      const error = validateUrl(url)
      if (error) {
        newErrors[index] = error
      }
    })
    return newErrors
  }

  // 重置对话框状态
  const resetDialog = () => {
    // 先关闭对话框，再清空内容
    setOpen(false)
    // 使用setTimeout确保在对话框关闭动画完成后再清空内容
    setTimeout(() => {
      setTextareaValue('')
    }, 300)
  }

  // 智能拆分函数
  const handleSplit = () => {
    if (!textareaValue) return

    // 支持多种分隔符
    const separators = ['\n', ';', '；', ',', '，', '\\n']
    let splitUrls = [textareaValue]
    
    // 依次尝试每个分隔符
    for (const separator of separators) {
      if (textareaValue.includes(separator)) {
        splitUrls = textareaValue
          .split(separator)
          .map(url => url.trim())
          .filter(url => url.length > 0)
        break
      }
    }

    // 找到第一个空值的索引
    const firstEmptyIndex = urls.findIndex(url => !url.trim())
    
    // 创建新的URL数组
    let newUrls: string[]
    if (firstEmptyIndex !== -1) {
      // 如果有空值，从空值位置开始替换
      newUrls = [
        ...urls.slice(0, firstEmptyIndex),
        ...splitUrls,
        ...urls.slice(firstEmptyIndex + 1)
      ]
    } else {
      // 如果没有空值，追加到末尾
      newUrls = [...urls, ...splitUrls]
    }

    setUrls(newUrls)
    
    // 验证所有URL，包括新添加的
    const newErrors = validateUrls(newUrls)
    setErrors(newErrors)
    
    // 立即清空文本内容，然后关闭对话框
    setTextareaValue('')
    setOpen(false)
  }

  // 处理对话框打开/关闭
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // 打开时填充当前值
      setOpen(true)
    } else {
      // 关闭时重置
      resetDialog()
    }
  }

  return (
    <Card className="border-muted">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>输入URL地址</CardTitle>
            <CardDescription>
              请输入需要分析的URL地址
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                <Split className="h-4 w-4" />
                智能拆分
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>智能拆分URL</DialogTitle>
                <DialogDescription>
                  支持多种分隔符自动拆分URL地址
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="输入多个URL，支持：&#10;1. 回车换行&#10;2. 分号分隔（中英文）&#10;3. 逗号分隔（中英文）&#10;4. \n 分隔"
                  className="min-h-[200px]"
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                  onClick={handleSplit}
                >
                  拆分并填充
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {urls.map((url, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 1, x: 0 }}
                  exit={{ 
                    opacity: 0, 
                    x: "-100%",
                    position: "absolute",
                    transition: {
                      duration: 0.2,
                      ease: "easeInOut"
                    }
                  }}
                  className="mb-4"
                >
                  <UrlInputItem
                    value={url}
                    onChange={(value) => updateUrl(index, value)}
                    onRemove={index > 0 ? () => removeUrl(index) : undefined}
                    error={errors[index]}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={addUrl}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加URL
            </Button>
            
            <Button 
              onClick={handleSubmit}
              className="min-w-[120px]"
            >
              开始分析
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UrlInputForm 