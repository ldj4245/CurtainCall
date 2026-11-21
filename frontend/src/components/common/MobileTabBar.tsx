import { BookOpen, Home, Search, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function MobileTabBar() {
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuthStore()
  if (pathname.startsWith('/chat/')) return null
  const tabs = [
    { to: '/', label: '홈', icon: Home, active: pathname === '/' },
    { to: '/shows', label: '공연', icon: Search, active: pathname.startsWith('/shows') },
    { to: '/diary', label: '내 기록', icon: BookOpen, active: pathname.startsWith('/diary') },
    { to: '/my', label: '마이', icon: UserRound, active: pathname.startsWith('/my') || pathname.startsWith('/chat') },
  ]
  return (
    <nav className="mobile-navigation md:hidden" aria-label="모바일 주 메뉴">
      {tabs.map(({ to, label, icon: Icon, active }) => <Link key={to} to={to} aria-current={active ? 'page' : undefined}
        onClick={() => { if (!isAuthenticated && (to === '/diary' || to === '/my')) sessionStorage.setItem('postLoginRedirect', to) }}
        className={`mobile-nav-link ${active ? 'is-active' : ''}`}><Icon size={21} strokeWidth={active ? 2 : 1.5} /><span>{label}</span></Link>)}
    </nav>
  )
}
