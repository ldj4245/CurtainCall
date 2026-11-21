import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { showsApi } from '../../api/shows'
import ShowCard from '../../components/show/ShowCard'
import Pagination from '../../components/common/Pagination'

const GENRES = [{ value: '', label: '전체' }, { value: 'MUSICAL', label: '뮤지컬' }, { value: 'PLAY', label: '연극' }]
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export default function ShowListPage() {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword') ?? ''
  const genre = params.get('genre') ?? ''
  const status = params.get('status') ?? ''
  const region = params.get('region') ?? ''
  const parsedPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0

  const [input, setInput] = useState(keyword)
  const [debouncedInput, setDebouncedInput] = useState(keyword.trim())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => setInput(keyword), [keyword])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInput(input.trim()), 200)
    return () => window.clearTimeout(timer)
  }, [input])

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const { data: suggestions = [] } = useQuery({
    queryKey: ['shows', 'autocomplete', debouncedInput],
    queryFn: () => showsApi.autocomplete(debouncedInput),
    enabled: dropdownOpen && debouncedInput.length >= 2,
    staleTime: 60000,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shows', keyword, genre, status, region, page],
    queryFn: () => showsApi.search({ keyword, genre, status, region, page, size: 12 }),
  })

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const clear = () => {
    setParams({})
    setInput('')
    setDropdownOpen(false)
  }

  const hasFilter = Boolean(keyword || genre || status || region)
  const visibleSuggestions = suggestions.slice(0, 6)

  return (
    <div className="page-width">
      <header className="page-heading"><h1>공연 검색</h1></header>
      <section className="search-surface" aria-label="공연 검색과 필터">
        <div ref={searchBoxRef} className="relative max-w-[590px]">
          <form
            className="large-search"
            onSubmit={event => {
              event.preventDefault()
              setDropdownOpen(false)
              update('keyword', input.trim())
            }}
          >
            <input
              aria-label="공연명 또는 출연 배우"
              value={input}
              onFocus={() => setDropdownOpen(true)}
              onChange={event => {
                setInput(event.target.value)
                setDropdownOpen(true)
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') setDropdownOpen(false)
              }}
              placeholder="공연명 또는 배우"
            />
            {input && (
              <button
                type="button"
                className="icon-button !h-9 !w-9"
                onClick={() => {
                  setInput('')
                  setDropdownOpen(false)
                  update('keyword', '')
                }}
                aria-label="검색어 지우기"
              >
                <X size={17} />
              </button>
            )}
            <button className="button-primary !min-h-10 !px-4 !text-[12px]" type="submit">검색</button>
          </form>

          {dropdownOpen && debouncedInput.length >= 2 && visibleSuggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="공연 검색 제안"
              className="absolute left-0 right-0 top-full z-20 mt-1 border border-[#ccc] bg-white divide-y divide-[#f0f0f0]"
            >
              {visibleSuggestions.map(item => (
                <li key={item.id}>
                  <Link
                    to={`/shows/${item.id}`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] text-[#242424] hover:bg-[#fbfbfb]"
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-[#888]">
                      {item.genre === 'MUSICAL' ? '뮤지컬' : item.genre === 'PLAY' ? '연극' : ''}
                      {item.status === 'UPCOMING' ? ' · 예정' : item.status === 'ENDED' ? ' · 종료' : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="filter-row">
          <div className="flex gap-2">
            {GENRES.map(item => (
              <button
                key={item.value}
                aria-pressed={genre === item.value}
                className={`filter-chip ${genre === item.value ? 'is-active' : ''}`}
                onClick={() => update('genre', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2 max-sm:ml-0">
            <select aria-label="공연 상태" className="filter-select" value={status} onChange={event => update('status', event.target.value)}>
              <option value="">모든 일정</option>
              <option value="ONGOING">공연 중</option>
              <option value="UPCOMING">개막 예정</option>
              <option value="ENDED">지난 공연</option>
            </select>
            <select aria-label="공연 지역" className="filter-select" value={region} onChange={event => update('region', event.target.value)}>
              <option value="">모든 지역</option>
              {REGIONS.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-[12px] text-ink-lighter">
          {isLoading ? '검색 중' : <><span className="font-medium text-ink-base">{data?.totalElements ?? 0}</span>개의 공연{keyword && ` · “${keyword}” 검색 결과`}</>}
        </p>
        {hasFilter && <button onClick={clear} className="text-link !text-[12px]"><X size={13} />필터 초기화</button>}
      </div>

      {isLoading ? (
        <p className="feed-notice" role="status">불러오는 중...</p>
      ) : isError ? (
        <div className="quiet-empty">
          <p>공연 목록을 불러오지 못했습니다.</p>
          <button className="button-secondary" onClick={() => refetch()}>다시 불러오기</button>
        </div>
      ) : data?.content.length ? (
        <>
          <div className="feed-list">
            {data.content.map((show, index) => <ShowCard key={show.id} show={show} index={page * 12 + index} />)}
          </div>
          <div className="mt-10">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={value => {
                update('page', String(value))
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        </>
      ) : (
        <div className="quiet-empty">
          <p>검색 결과가 없습니다.</p>
          <span className="text-[12px]">검색어나 필터를 변경해 주세요.</span>
          {hasFilter && <button onClick={clear} className="button-secondary">전체 공연 보기</button>}
        </div>
      )}
    </div>
  )
}
