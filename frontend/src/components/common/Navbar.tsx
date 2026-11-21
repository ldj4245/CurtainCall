import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const startRecord = () => {
    navigate('/diary?compose=1')
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
        <div className="header-account">
          {isAuthenticated ? (
            <>
              <NavLink to="/notifications" className={({ isActive }) => isActive ? 'is-active' : ''}>알림</NavLink>
              <NavLink to="/my" className={({ isActive }) => isActive ? 'is-active' : ''}>마이</NavLink>
            </>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  )
}
