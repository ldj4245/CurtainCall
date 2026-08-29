import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { showsApi } from '../../api/shows'
import ShowCard from '../../components/show/ShowCard'
import Pagination from '../../components/common/Pagination'

const GENRES = [
  { value: '', label: '전체' },
  { value: 'MUSICAL', label: '뮤지컬' },
  { value: 'PLAY', label: '연극' },
]

const STATUSES = [
  { value: '', label: '전체' },
  { value: 'ONGOING', label: '공연 중' },
  { value: 'UPCOMING', label: '공연 예정' },
  { value: 'ENDED', label: '종료' },
]

const REGIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '인천', label: '인천' },
  { value: '대전', label: '대전' },
  { value: '광주', label: '광주' },
]

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[12px] border transition-colors ${
        active
          ? 'border-ink-darkest bg-ink-darkest text-white font-semibold'
          : 'border-transparent text-ink-lighter hover:text-ink-muted'
      }`}
    >
      {label}
    </button>
  )
}

export default function ShowListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') ?? ''
  const initialGenre = searchParams.get('genre') ?? ''
  const initialStatus = searchParams.get('status') ?? ''
  const initialRegion = searchParams.get('region') ?? ''
  const initialPage = Number(searchParams.get('page') ?? '0')

  const [keyword, setKeyword] = useState(initialKeyword)
  const [inputVal, setInputVal] = useState(initialKeyword)
  const [genre, setGenre] = useState(initialGenre)
  const [status, setStatus] = useState(initialStatus)
  const [region, setRegion] = useState(initialRegion)
  const [page, setPage] = useState(Number.isNaN(initialPage) ? 0 : initialPage)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const scrollYRef = useRef(0)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shows', keyword, genre, status, region, page],
    queryFn: () => showsApi.search({ keyword, genre, status, region, page, size: 12 }),
  })

  useEffect(() => {
    const next = new URLSearchParams()
    if (keyword) next.set('keyword', keyword)
    if (genre) next.set('genre', genre)
    if (status) next.set('status', status)
    if (region) next.set('region', region)
    if (page > 0) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [keyword, genre, status, region, page, setSearchParams])

  useEffect(() => {
    if (!showMobileFilter) return
    scrollYRef.current = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
      const y = scrollYRef.current
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      window.scrollTo(0, y)
    }
  }, [showMobileFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setKeyword(inputVal)
    setPage(0)
  }

  const handleFilter = (key: 'genre' | 'status' | 'region', value: string) => {
    if (key === 'genre') setGenre(value)
    else if (key === 'status') setStatus(value)
    else setRegion(value)
    setPage(0)
  }

  const hasActiveFilter = Boolean(keyword || genre || status || region)
  const resetFilters = () => {
    setKeyword('')
    setInputVal('')
    setGenre('')
    setStatus('')
    setRegion('')
    setPage(0)
  }

  const selectedFilterCount =
    Number(Boolean(genre)) + Number(Boolean(status)) + Number(Boolean(region))

  const activeFilterSummary = [
    genre ? GENRES.find((g) => g.value === genre)?.label : null,
    status ? STATUSES.find((s) => s.value === status)?.label : null,
    region ? region : null,
    keyword ? `"${keyword}"` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="px-4 py-4 sm:px-5">
        {/* 헤더 */}
        <p className="text-[10px] text-ink-lightest mb-1.5">홈 &gt; 공연 찾기</p>
        <div className="mb-5 border-b border-line-lightest pb-3">
          <h1 className="text-[18px] font-semibold tracking-[-0.05em] text-ink-darker">
            공연 찾기
          </h1>
        </div>

        {/* 검색창 */}
        <div className="sticky top-[59px] z-30 bg-surface-base -mx-5 px-5 pt-1 pb-3 sm:static sm:mx-0 sm:px-0 sm:pt-0 sm:pb-0">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lightest"
                size={14}
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="공연명, 출연진 검색"
                className="w-full h-[38px] pl-9 pr-4 text-[12px] bg-surface-base border border-line-base text-ink-base placeholder:text-ink-lightest focus:border-ink-base focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="h-[38px] px-5 bg-ink-darkest text-white text-[12px] font-semibold hover:bg-brand transition-colors"
            >
              검색
            </button>
          </form>

          {/* 모바일 필터 버튼 */}
          <div className="sm:hidden mb-4">
            <button
              onClick={() => setShowMobileFilter(true)}
              className="w-full flex items-center justify-center gap-1.5 h-[36px] border border-line-base text-[11px] font-medium text-ink-light"
            >
              <SlidersHorizontal size={13} />
              필터
              {selectedFilterCount > 0 && (
                <span className="text-[10px] bg-ink-darkest text-white px-1.5 py-0.5">
                  {selectedFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 데스크톱 필터 */}
        <div className="hidden sm:block mb-6">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-line-lightest pb-3">
            <span className="text-[11px] text-ink-lightest mr-2 min-w-[28px]">장르</span>
            {GENRES.map(({ value, label }) => (
              <Pill
                key={`g-${value}`}
                active={genre === value}
                label={label}
                onClick={() => handleFilter('genre', value)}
              />
            ))}
            <span className="w-px h-3 bg-line-lighter mx-2" />
            <span className="text-[11px] text-ink-lightest mr-2 min-w-[28px]">상태</span>
            {STATUSES.map(({ value, label }) => (
              <Pill
                key={`s-${value}`}
                active={status === value}
                label={label}
                onClick={() => handleFilter('status', value)}
              />
            ))}
            <span className="w-px h-3 bg-line-lighter mx-2" />
            <span className="text-[11px] text-ink-lightest mr-2 min-w-[28px]">지역</span>
            {REGIONS.slice(0, 5).map(({ value, label }) => (
              <Pill
                key={`r-${value}`}
                active={region === value}
                label={label}
                onClick={() => handleFilter('region', value)}
              />
            ))}
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="ml-2 flex items-center gap-1 text-[11px] text-ink-lightest hover:text-ink-muted"
              >
                <X size={11} />
                초기화
              </button>
            )}
          </div>
          {activeFilterSummary && (
            <p className="mt-2 text-[11px] text-ink-lighter">
              선택된 필터: <span className="font-medium text-ink-muted">{activeFilterSummary}</span>
            </p>
          )}
        </div>

        {/* 모바일 필터 시트 */}
        {showMobileFilter && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:hidden"
            onClick={() => setShowMobileFilter(false)}
          >
            <div
              className="w-full bg-surface-base border-t border-line-base"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-line-lightest">
                <h2 className="text-[14px] font-semibold text-ink-base">필터</h2>
                <button onClick={() => setShowMobileFilter(false)} className="text-ink-lightest">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                <div>
                  <p className="text-[11px] font-semibold text-ink-light mb-2">장르</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map(({ value, label }) => (
                      <Pill
                        key={`mg-${value}`}
                        active={genre === value}
                        label={label}
                        onClick={() => handleFilter('genre', value)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-light mb-2">상태</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map(({ value, label }) => (
                      <Pill
                        key={`ms-${value}`}
                        active={status === value}
                        label={label}
                        onClick={() => handleFilter('status', value)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-light mb-2">지역</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONS.map(({ value, label }) => (
                      <Pill
                        key={`mr-${value}`}
                        active={region === value}
                        label={label}
                        onClick={() => handleFilter('region', value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={resetFilters}
                  className="flex-1 h-[38px] border border-line-base text-[12px] text-ink-muted hover:border-ink-base transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="flex-1 h-[38px] bg-ink-darkest text-white text-[12px] font-semibold hover:bg-brand transition-colors"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 결과 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-surface-muted animate-pulse" />
                <div className="mt-2 h-3 bg-surface-muted w-4/5 animate-pulse" />
                <div className="mt-1 h-2.5 bg-surface-muted w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-[14px] font-medium text-ink-light">공연 목록을 불러오지 못했어요</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-[12px] font-semibold text-brand hover:underline"
            >
              다시 시도
            </button>
          </div>
        ) : data && data.content.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-[12px] text-ink-lighter">
                총{' '}
                <span className="font-semibold text-ink-base">{data.totalElements}</span>개의 공연
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              {data.content.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-24 border border-line-lightest">
            <p className="text-[14px] font-medium text-ink-light">검색 결과가 없습니다</p>
            <p className="text-[11px] text-ink-lightest mt-1.5">다른 검색어나 필터를 시도해보세요</p>
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="mt-4 text-[11px] text-ink-muted underline underline-offset-2"
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
