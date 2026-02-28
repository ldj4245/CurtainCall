import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <p className="text-7xl font-black text-brand/20 mb-2">404</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-sm">
                요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
            </p>
            <div className="flex gap-3">
                <button onClick={() => navigate(-1)} className="btn-secondary px-5 py-2.5 text-sm">
                    이전 페이지
                </button>
                <button onClick={() => navigate('/')} className="btn-primary px-5 py-2.5 text-sm">
                    홈으로 가기
                </button>
            </div>
        </div>
    )
}
