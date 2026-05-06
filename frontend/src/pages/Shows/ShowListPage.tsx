import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
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
  { value: 'ENDED', label: '공연 종료' },
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

  const selectedFilterCount = Number(Boolean(genre)) + Number(Boolean(status)) + Number(Boolean(region))

  return (
    <div className="app-page">
      <div className="app-container py-6 md:py-10">
      <section className="mb-6 rounded-[32px] border border-gray-100 bg-white p-5 md:p-7">
        <p className="section-eyebrow">Shows</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl">공연 탐색</h1>
            <p className="section-copy">공연명, 장르, 상태를 골라 지금 볼 작품을 찾아보세요.</p>
          </div>
          <p className="hidden text-sm font-semibold text-gray-400 md:block">KOPIS 공연 정보 기준</p>
        </div>
      </section>

      <div className="sticky top-[4.5rem] z-30 -mx-4 mb-5 bg-warm-50/95 px-4 pb-3 pt-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-0">
        <form onSubmit={handleSearch} className="flex gap-3 mb-3 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="공연명, 출연진 검색"
              className="input-field pl-11"
            />
          </div>
          <button type="submit" className="btn-primary px-6">검색</button>
        </form>

        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700"
          >
            <SlidersHorizontal size={16} />
            필터
            {selectedFilterCount > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                {selectedFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mb-8 hidden flex-wrap items-center gap-x-4 gap-y-2 rounded-[28px] border border-gray-100 bg-white p-4 sm:flex">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 shrink-0">장르</span>
          {GENRES.map(({ value, label }) => (
            <button
              key={`g-${value}`}
              onClick={() => handleFilter('genre', value)}
              className={genre === value ? 'filter-pill-active' : 'filter-pill-inactive'}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 shrink-0">상태</span>
          {STATUSES.map(({ value, label }) => (
            <button
              key={`s-${value}`}
              onClick={() => handleFilter('status', value)}
              className={status === value ? 'filter-pill-active' : 'filter-pill-inactive'}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 shrink-0">지역</span>
          {REGIONS.slice(0, 5).map(({ value, label }) => (
            <button
              key={`r-${value}`}
              onClick={() => handleFilter('region', value)}
              className={region === value ? 'filter-pill-active' : 'filter-pill-inactive'}
            >
              {label}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-400 hover:text-brand underline underline-offset-2"
          >
            초기화
          </button>
        )}
      </div>

      {showMobileFilter && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:hidden"
          onClick={() => setShowMobileFilter(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">필터</h2>
              <button onClick={() => setShowMobileFilter(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">장르</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(({ value, label }) => (
                  <button
                    key={`mg-${value}`}
                    onClick={() => handleFilter('genre', value)}
                    className={genre === value ? 'filter-pill-active' : 'filter-pill-inactive'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">상태</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(({ value, label }) => (
                  <button
                    key={`ms-${value}`}
                    onClick={() => handleFilter('status', value)}
                    className={status === value ? 'filter-pill-active' : 'filter-pill-inactive'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">지역</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(({ value, label }) => (
                  <button
                    key={`mr-${value}`}
                    onClick={() => handleFilter('region', value)}
                    className={region === value ? 'filter-pill-active' : 'filter-pill-inactive'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700"
              >
                초기화
              </button>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="flex-1 btn-primary py-2.5 text-sm"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-warm-100 rounded-2xl" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-warm-100 rounded w-3/4" />
                <div className="h-3 bg-warm-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium text-gray-600">공연 목록을 불러오지 못했어요</p>
          <p className="text-sm text-gray-400 mt-1">잠시 후 다시 시도해주세요</p>
          <button onClick={() => refetch()} className="btn-primary mt-4 px-6">
            다시 시도
          </button>
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <p className="mb-5 text-sm text-gray-400">
            총 <span className="font-semibold text-gray-900">{data.totalElements}</span>개의 공연
          </p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {data.content.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-20">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-warm-100 text-gray-400 flex items-center justify-center">
            <Search size={20} />
          </div>
          <p className="text-lg font-medium text-gray-600">검색 결과가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">다른 검색어나 필터를 시도해보세요</p>
        </div>
      )}
      </div>
    </div>
  )
}
