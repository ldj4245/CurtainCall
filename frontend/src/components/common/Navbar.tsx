import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { isAuthenticated } = useAuthStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (pathname.startsWith('/chat/')) return null

  const startRecord = () => {
    const destination = '/diary?compose=1'
    navigate(destination)
  }

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">본문으로 바로가기</a>
      <div className="page-width site-header-inner">
        <Link to="/" className="wordmark" aria-label="커튼콜 홈">커튼콜</Link>
        <nav className="header-links" aria-label="주 메뉴">
          {[['/', '공연'], ['/shows', '검색'], ['/diary', '내 기록'], ['/plans', '관람 예정']].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'is-active' : ''}
            >
              {label}
            </NavLink>
          ))}
          <span className="nav-divider" aria-hidden="true">|</span>
          <button type="button" onClick={startRecord}>기록하기</button>
        </nav>
        {isAuthenticated && <Link to="/notifications" className="account-link">알림</Link>}
        <Link to={isAuthenticated ? '/my' : '/login'} className="account-link">
          {isAuthenticated ? '마이' : '로그인'}
        </Link>
      </div>
    </header>
  )
}
