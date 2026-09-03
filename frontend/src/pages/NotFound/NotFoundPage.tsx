import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center bg-surface-base">
      <p className="text-[64px] font-bold leading-none tracking-tight text-ink-lightest/40">404</p>
      <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-ink-darkest">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        요청하신 페이지가 존재하지 않거나, 주소가 변경되었을 수 있습니다.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="h-10 px-4 border border-line-base bg-white text-[13px] font-medium text-ink-muted hover:text-ink-darkest hover:border-line-dark rounded-md inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> 이전 페이지
        </button>
        <button
          onClick={() => navigate('/')}
          className="h-10 px-4 bg-ink-darkest text-white text-[13px] font-semibold hover:bg-brand rounded-md inline-flex items-center gap-1.5 transition-colors"
        >
          <Home size={14} /> 홈으로 가기
        </button>
      </div>
    </main>
  )
}
