import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Search, User } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'
  if (isLoginPage) return null

  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        location.pathname.startsWith(path)
          ? 'text-gray-900 bg-gray-100'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold">
              C
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">CurtainCall</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5">
            {navLink('/shows', '공연')}
            {isAuthenticated && navLink('/diary', '다이어리')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/shows"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Search size={20} />
          </Link>
          {isAuthenticated ? (
            <Link
              to="/my"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                location.pathname === '/my'
                  ? 'text-gray-900 bg-gray-100 border-gray-300'
                  : 'text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-gray-600" />
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
