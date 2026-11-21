import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { showsApi } from '../../api/shows'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/', label: '공연', end: true },
  { to: '/community', label: '커뮤니티', end: false },
  { to: '/diary', label: '내 기록', end: false },
  { to: '/plans', label: '관람 예정', end: false },
] as const

export default function Navbar() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setDropdownOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const inDesktop = desktopSearchRef.current?.contains(target)
      const inMobile = mobileSearchRef.current?.contains(target)
      if (!inDesktop && !inMobile) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const { data: suggestions = [] } = useQuery({
    queryKey: ['shows', 'navbar-autocomplete', debouncedQuery],
    queryFn: () => showsApi.autocomplete(debouncedQuery),
    enabled: dropdownOpen && debouncedQuery.length >= 2,
    staleTime: 60_000,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    setDropdownOpen(false)
    setMobileSearchOpen(false)
    navigate(trimmed ? `/shows?keyword=${encodeURIComponent(trimmed)}` : '/shows')
  }

  const handleSelectShow = (showId: number) => {
    setDropdownOpen(false)
    setMobileSearchOpen(false)
    setQuery('')
    navigate(`/shows/${showId}`)
  }

  const renderSearchBox = (mobile: boolean) => {
    const visibleSuggestions = suggestions.slice(0, 5)
    const trimmed = query.trim()
    const fullSearchUrl = trimmed ? `/shows?keyword=${encodeURIComponent(trimmed)}` : '/shows'

    return (
      <div ref={mobile ? mobileSearchRef : desktopSearchRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={query}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setDropdownOpen(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDropdownOpen(false)
                if (mobile) setMobileSearchOpen(false)
              }
            }}
            aria-label="공연 빠른 검색"
            placeholder="공연, 배우 검색"
            className="w-full h-8 px-2.5 border border-[#d6d6d6] bg-[#fbfbfb] focus:bg-white focus:border-[#242424] text-[12px] text-[#111] outline-none transition-colors"
          />
          {mobile && (
            <button type="submit" className="h-8 px-2.5 border border-[#ccc] bg-white text-[12px] text-[#333] shrink-0">
              검색
            </button>
          )}
        </form>

        {dropdownOpen && debouncedQuery.length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#dedede] z-40 shadow-sm">
            {visibleSuggestions.length > 0 ? (
              <ul role="listbox" aria-label="검색 추천 공연">
                {visibleSuggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectShow(item.id)}
                      className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#f5f5f5] border-b border-[#f0f0f0] flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-[#111] truncate">{item.title}</span>
                      {item.genre && (
                        <span className="text-[11px] text-[#888] shrink-0">
                          {item.genre === 'MUSICAL' ? '뮤지컬' : item.genre === 'PLAY' ? '연극' : item.genre}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2.5 text-[12px] text-[#888] border-b border-[#f0f0f0]">일치하는 공연이 없습니다.</p>
            )}
            <Link
              to={fullSearchUrl}
              onClick={() => {
                setDropdownOpen(false)
                setMobileSearchOpen(false)
              }}
              className="block px-3 py-2 text-[11px] text-[#666] hover:text-[#111] hover:bg-[#fafafa]"
            >
              상세 검색·필터에서 보기 →
            </Link>
          </div>
        )}
      </div>
    )
  }

  const accountLinks = isAuthenticated ? (
    <>
      <NavLink to="/notifications" className={({ isActive }) => isActive ? 'font-semibold text-[#000]' : 'text-[#333] hover:underline'}>알림</NavLink>
      <NavLink to="/my" className={({ isActive }) => isActive ? 'font-semibold text-[#000]' : 'text-[#333] hover:underline'}>마이</NavLink>
    </>
  ) : (
    <Link to="/login" className="text-[#111] font-medium hover:underline">로그인</Link>
  )

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">본문으로 바로가기</a>

      {/* 데스크톱 헤더 */}
      <div className="page-width hidden md:flex items-center gap-6 min-h-[52px]">
        <Link to="/" className="wordmark shrink-0" aria-label="커튼콜 홈">커튼콜</Link>
        <nav className="flex items-center gap-5 text-[13px] shrink-0" aria-label="주 메뉴">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive
                  ? 'text-[#000] font-semibold underline underline-offset-4'
                  : 'text-[#333] hover:text-[#000] hover:underline'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 flex-1 justify-end max-w-[420px]">
          <div className="flex-1 max-w-[260px]">{renderSearchBox(false)}</div>
          <div className="flex items-center gap-3.5 text-[13px] shrink-0">{accountLinks}</div>
        </div>
      </div>

      {/* 모바일 헤더 (4메뉴 균등 배치) */}
      <div className="md:hidden">
        <div className="page-width flex items-center justify-between min-h-[46px] gap-2">
          <Link to="/" className="wordmark" aria-label="커튼콜 홈">커튼콜</Link>
          <div className="flex items-center gap-3 text-[12px]">
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev)
                setDropdownOpen(true)
              }}
              aria-expanded={mobileSearchOpen}
              className="px-2.5 py-1 border border-[#d6d6d6] bg-[#fbfbfb] text-[#333]"
            >
              {mobileSearchOpen ? '닫기' : '검색'}
            </button>
            {accountLinks}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="page-width pb-2.5">{renderSearchBox(true)}</div>
        )}

        <nav className="border-t border-[#f0f0f0] grid grid-cols-4 text-center text-[12px]" aria-label="주 메뉴">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `py-2.5 ${isActive ? 'text-[#111] font-semibold border-b-2 border-[#242424]' : 'text-[#666]'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
