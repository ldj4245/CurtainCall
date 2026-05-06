import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Search, User, Ticket } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'
  if (isLoginPage) return null

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`relative whitespace-nowrap px-1 py-3 text-[15px] font-bold transition-colors ${
        location.pathname.startsWith(path) ? 'text-gray-950' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {label}
      {location.pathname.startsWith(path) && (
        <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gray-950" />
      )}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <div className="app-container flex h-[4.5rem] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-white">
              <Ticket size={16} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-gray-950">CurtainCall</span>
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            {navLink('/', '투데이')}
            {navLink('/shows', '공연')}
            {isAuthenticated && navLink('/diary', '다이어리')}
            {isAuthenticated && navLink('/chat', '동행 채팅')}
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/shows"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-warm-50 text-gray-500 md:hidden"
            aria-label="공연 검색"
          >
            <Search size={18} />
          </Link>
          <div className="hidden w-[280px] sm:block lg:w-[340px]">
            <SearchBar />
          </div>
          {isAuthenticated ? (
            <Link
              to="/my"
              className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-sm font-semibold transition-all sm:px-3 ${location.pathname === '/my'
                  ? 'text-brand bg-brand-50 border-brand-200'
                  : 'text-gray-600 border-gray-200 hover:text-brand hover:border-brand/30 hover:bg-brand-50'
                }`}
            >
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-warm-100">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={14} className="text-gray-500" />
                )}
              </div>
              <span className="hidden sm:inline">{user?.nickname}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary whitespace-nowrap px-4 py-2 text-sm">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
