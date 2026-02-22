import { BookOpen, Home, Search, User } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const loginLinkState = { from: { pathname: location.pathname } }

  const tabs = [
    { to: '/', label: '홈', icon: Home, active: location.pathname === '/' },
    { to: '/shows', label: '공연', icon: Search, active: location.pathname.startsWith('/shows') },
    {
      to: isAuthenticated ? '/diary' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '다이어리',
      icon: BookOpen,
      active: isAuthenticated && location.pathname.startsWith('/diary'),
    },
    {
      to: isAuthenticated ? '/my' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '마이',
      icon: User,
      active: isAuthenticated && location.pathname.startsWith('/my'),
    },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, state, label, icon: Icon, active }) => (
          <li key={label}>
            <Link
              to={to}
              state={state}
              onClick={(e) => {
                const requiresAuthTab = (label === '다이어리' || label === '마이') && !isAuthenticated
                if (!requiresAuthTab) return
                e.preventDefault()
                sessionStorage.setItem('postLoginRedirect', `${location.pathname}${location.search}`)
                toast('로그인 후 이용할 수 있어요.')
                navigate('/login', { state: loginLinkState })
              }}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${active ? 'text-brand font-semibold' : 'text-gray-400'
                }`}
            >
              <span
                className={`absolute top-0 h-0.5 w-8 rounded-full transition-opacity ${active ? 'bg-brand opacity-100' : 'opacity-0'
                  }`}
              />
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
