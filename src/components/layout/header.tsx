import { FC } from 'react'

const Header: FC = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">URL内容分析工具</h1>
      </div>
    </header>
  )
}

export default Header 