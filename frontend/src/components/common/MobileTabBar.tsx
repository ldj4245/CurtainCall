import { BookOpen, Home, MessageSquare, Search, User } from 'lucide-react'
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
      to: isAuthenticated ? '/chat' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '채팅',
      icon: MessageSquare,
      active: isAuthenticated && location.pathname.startsWith('/chat'),
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:hidden">
      <ul className="grid grid-cols-5 px-1">
        {tabs.map(({ to, state, label, icon: Icon, active }) => (
          <li key={label}>
            <Link
              to={to}
              state={state}
              onClick={(e) => {
                const requiresAuthTab = (label === '다이어리' || label === '채팅' || label === '마이') && !isAuthenticated
                if (!requiresAuthTab) return
                e.preventDefault()
                sessionStorage.setItem('postLoginRedirect', `${location.pathname}${location.search}`)
                toast('로그인 후 이용할 수 있어요.')
                navigate('/login', { state: loginLinkState })
              }}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? 'font-bold text-brand' : 'text-gray-400'
                }`}
            >
              <span
                className={`absolute top-1 h-1 w-1 rounded-full transition-opacity ${active ? 'bg-brand opacity-100' : 'opacity-0'
                  }`}
              />
              <span className={`flex h-8 w-8 items-center justify-center rounded-2xl ${active ? 'bg-brand-50' : ''}`}>
                <Icon size={18} />
              </span>
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
