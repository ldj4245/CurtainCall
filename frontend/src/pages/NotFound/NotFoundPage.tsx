import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <main className="page-shell flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
            <p className="page-kicker">Page not found</p>
            <p className="mt-3 text-[72px] font-semibold leading-none tracking-[-0.08em] text-[#e5e8ee]">404</p>
            <h1 className="mt-4 text-[25px] font-semibold tracking-[-0.05em] text-[#172033]">페이지를 찾을 수 없습니다</h1>
            <p className="mt-3 max-w-sm text-[14px] leading-6 text-[#697386]">
                요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
                <button onClick={() => navigate(-1)} className="btn-secondary">
                    <ArrowLeft size={15} /> 이전 페이지
                </button>
                <button onClick={() => navigate('/')} className="btn-primary">
                    <Home size={15} /> 홈으로 가기
                </button>
            </div>
        </main>
    )
}
