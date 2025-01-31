import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import UrlAnalyzer from '@/components/url-analyzer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <UrlAnalyzer />
      </main>

      <Footer />
    </div>
  )
}
