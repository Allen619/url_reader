import { FC } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string
  className?: string
}

const FormError: FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-sm bg-destructive/5 text-[0.8rem] font-medium text-destructive",
      className
    )}>
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  )
}

export default FormError 