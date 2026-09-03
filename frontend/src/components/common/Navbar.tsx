import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Search, User, ArrowLeft } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isChatRoom = location.pathname.startsWith('/chat/')
  if (isAuthPage || isChatRoom) return null

  const isShowDetail = location.pathname.startsWith('/shows/') && location.pathname !== '/shows'

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-line-lighter px-4 bg-surface-base sticky top-0 z-40">
      {isShowDetail ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-ink-muted hover:text-ink-darkest transition-colors rounded"
            aria-label="이전 페이지로 이동"
          >
            <ArrowLeft size={19} />
          </button>
          <Link to="/" className="flex items-center gap-1.5 text-[14px] font-semibold tracking-[-0.03em] text-ink-darkest">
            CurtainCall
          </Link>
        </div>
      ) : (
        <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.055em] text-ink-darkest">
          <span className="grid h-5 w-5 place-items-center bg-brand font-serif text-[12px] text-white rounded-[2px]">C</span>
          CurtainCall
        </Link>
      )}

      <div className="flex items-center gap-2">
        <Link
          to="/shows"
          className="grid h-8 w-8 place-items-center text-ink-muted hover:text-ink-darkest transition-colors"
          aria-label="공연 검색"
        >
          <Search size={17} />
        </Link>
        {isAuthenticated ? (
          <Link
            to="/my"
            className="grid h-8 w-8 place-items-center text-ink-muted hover:text-ink-darkest transition-colors"
            aria-label="마이페이지"
          >
            <User size={17} />
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-[11px] font-medium text-ink-muted hover:text-ink-darkest px-2 py-1 transition-colors"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}
