import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const loginLinkState = { from: { pathname: location.pathname } }

  if (location.pathname.startsWith('/chat/')) {
    return null
  }

  const tabs = [
    { to: '/', label: '홈', active: location.pathname === '/' },
    { to: '/shows', label: '공연 찾기', active: location.pathname.startsWith('/shows') },
    {
      to: isAuthenticated ? '/diary' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '관극 기록',
      active: isAuthenticated && location.pathname.startsWith('/diary'),
    },
    {
      to: isAuthenticated ? '/chat' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '동행',
      active: isAuthenticated && location.pathname.startsWith('/chat'),
    },
    {
      to: isAuthenticated ? '/my' : '/login',
      state: isAuthenticated ? undefined : loginLinkState,
      label: '마이',
      active: isAuthenticated && location.pathname.startsWith('/my'),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] z-50 border-t border-line-base bg-surface-base/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <ul className="grid h-[54px] grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, state, label, active }) => (
          <li key={label}>
            <Link
              to={to}
              state={state}
              onClick={(e) => {
                const requiresAuthTab = (label === '관극 기록' || label === '동행' || label === '마이') && !isAuthenticated
                if (!requiresAuthTab) return
                e.preventDefault()
                sessionStorage.setItem('postLoginRedirect', `${location.pathname}${location.search}`)
                toast('로그인이 필요합니다.')
                navigate('/login', { state: loginLinkState })
              }}
              className={`flex h-full flex-col items-center justify-center border-t-2 text-[11px] transition-colors ${
                active 
                  ? 'border-[#9d2244] font-semibold text-[#242424]' 
                  : 'border-transparent text-[#777]'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
