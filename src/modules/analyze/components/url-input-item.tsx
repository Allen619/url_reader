'use client'

import { FC, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import FormError from '@/components/ui/form-error'

interface UrlInputItemProps {
  value: string
  onChange: (value: string) => void
  onRemove?: () => void
  error?: string
  className?: string
}

const UrlInputItem: FC<UrlInputItemProps> = ({
  value,
  onChange,
  onRemove,
  error,
  className
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="url"
            value={value}
            onChange={handleChange}
            placeholder="https://example.com"
            className={cn(
              error && [
                "border-destructive",
                "focus-visible:ring-destructive",
                "placeholder:text-destructive/50"
              ]
            )}
          />
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <FormError message={error} />
    </div>
  )
}

export default UrlInputItem 