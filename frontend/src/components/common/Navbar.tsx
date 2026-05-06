import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { User, Ticket } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'
  if (isLoginPage) return null

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${location.pathname.startsWith(path)
          ? 'text-brand font-semibold'
          : 'text-gray-500 hover:text-gray-900'
        }`}
    >
      {label}
      {location.pathname.startsWith(path) && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand rounded-full" />
      )}
    </Link>
  )

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Ticket size={16} />
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">CurtainCall</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {navLink('/shows', '공연')}
            {isAuthenticated && navLink('/diary', '다이어리')}
            {isAuthenticated && navLink('/chat', '동행 채팅')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <SearchBar />
          </div>
          {isAuthenticated ? (
            <Link
              to="/my"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${location.pathname === '/my'
                  ? 'text-brand bg-brand-50 border-brand-200'
                  : 'text-gray-600 border-gray-200 hover:text-brand hover:border-brand/30 hover:bg-brand-50'
                }`}
            >
              <div className="w-7 h-7 rounded-full bg-warm-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-gray-500" />
                )}
              </div>
              <span className="hidden sm:inline">{user?.nickname}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-4 py-2">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
