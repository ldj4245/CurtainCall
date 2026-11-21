import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { showsApi } from '../../api/shows'
import ShowCard from '../../components/show/ShowCard'
import Pagination from '../../components/common/Pagination'

const GENRES = [{ value: '', label: '전체' }, { value: 'MUSICAL', label: '뮤지컬' }, { value: 'PLAY', label: '연극' }]
const REGIONS = ['서울', '경기', '부산', '대구', '인천', '대전', '광주']
export default function ShowListPage() {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('keyword') ?? ''
  const genre = params.get('genre') ?? ''
  const status = params.get('status') ?? ''
  const region = params.get('region') ?? ''
  const parsedPage = Number(params.get('page') ?? 0)
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0
  const [input, setInput] = useState(keyword)
  useEffect(() => setInput(keyword), [keyword])
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
  const clear = () => { setParams({}); setInput('') }
  const hasFilter = Boolean(keyword || genre || status || region)
  return (
    <div className="page-width">
      <header className="page-heading"><h1>공연 검색</h1></header>
      <section className="search-surface" aria-label="공연 검색과 필터">
        <form className="large-search" onSubmit={event => { event.preventDefault(); update('keyword', input.trim()) }}>

          <input key={keyword} aria-label="공연명 또는 출연 배우" value={input} onChange={event => setInput(event.target.value)} placeholder="공연명 또는 배우" />
          {input && <button type="button" className="icon-button !h-9 !w-9" onClick={() => { setInput(''); update('keyword', '') }} aria-label="검색어 지우기"><X size={17} /></button>}
          <button className="button-primary !min-h-10 !px-4 !text-[12px]" type="submit">검색</button>
        </form>
        <div className="filter-row">
          <div className="flex gap-2">{GENRES.map(item => <button key={item.value} aria-pressed={genre === item.value} className={`filter-chip ${genre === item.value ? 'is-active' : ''}`} onClick={() => update('genre', item.value)}>{item.label}</button>)}</div>
          <div className="ml-auto flex gap-2 max-sm:ml-0">
            <select aria-label="공연 상태" className="filter-select" value={status} onChange={event => update('status', event.target.value)}><option value="">모든 일정</option><option value="ONGOING">공연 중</option><option value="UPCOMING">개막 예정</option><option value="ENDED">지난 공연</option></select>
            <select aria-label="공연 지역" className="filter-select" value={region} onChange={event => update('region', event.target.value)}><option value="">모든 지역</option>{REGIONS.map(value => <option key={value}>{value}</option>)}</select>
          </div>
        </div>
      </section>
      <div className="mb-6 flex items-center justify-between"><p className="text-[12px] text-ink-lighter">{isLoading ? '검색 중' : <><span className="font-medium text-ink-base">{data?.totalElements ?? 0}</span>개의 공연{keyword && ` · “${keyword}” 검색 결과`}</>}</p>{hasFilter && <button onClick={clear} className="text-link !text-[11px]"><X size={13} />필터 초기화</button>}</div>
      {isLoading ? <p className="feed-notice" role="status">불러오는 중...</p>
      : isError ? <div className="quiet-empty"><p>공연 목록을 불러오지 못했습니다.</p><button className="button-secondary" onClick={() => refetch()}>다시 불러오기</button></div>
      : data?.content.length ? <><div className="feed-list">{data.content.map((show,index) => <ShowCard key={show.id} show={show} index={page*12+index} />)}</div><div className="mt-10"><Pagination currentPage={page} totalPages={data.totalPages} onPageChange={value => { update('page', String(value)); window.scrollTo({top:0,behavior:'smooth'}) }} /></div></>
      : <div className="quiet-empty"><p>검색 결과가 없습니다.</p><span className="text-[12px]">검색어나 필터를 변경해 주세요.</span>{hasFilter && <button onClick={clear} className="button-secondary">전체 공연 보기</button>}</div>}
    </div>
  )
}
