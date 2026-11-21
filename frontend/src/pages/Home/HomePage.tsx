import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { showsApi } from '../../api/shows'
import { retentionApi } from '../../api/retention'
import { useAuthStore } from '../../store/authStore'
import { diaryApi } from '../../api/diary'
import { localDate } from '../../utils/analytics'
import ShowCard from '../../components/show/ShowCard'
import TodayScheduleSection from '../../components/show/TodayScheduleSection'

const GENRES = [
  { value: '', label: '전체' },
  { value: 'MUSICAL', label: '뮤지컬' },
  { value: 'PLAY', label: '연극' },
]

export default function HomePage() {
  const { data: sourceStatus } = useQuery({ queryKey: ['source-status'], queryFn: () => api.get<Record<string, string>>('/shows/data-status').then(r => r.data), staleTime: 60000 })
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: retentionApi.plans, enabled: isAuthenticated })
  const { data: recent } = useQuery({ queryKey: ['diary', 'home-latest'], queryFn: () => diaryApi.getMyDiary(0, 1), enabled: isAuthenticated })
  const nextPlan = plans.find(p => !p.diaryId && p.watchedDate >= localDate())
  const pastPlans = plans.filter(p => !p.diaryId && p.watchedDate < localDate())
  const [genre, setGenre] = useState('')
  const [collection, setCollection] = useState<'ongoing' | 'upcoming' | 'today'>('ongoing')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shows', 'home-feed', collection, genre],
    queryFn: async () => collection === 'upcoming'
      ? (await showsApi.search({ status: 'UPCOMING', genre, size: 20 })).content
      : showsApi.getPopular(20, genre),
    enabled: collection !== 'today',
  })

  return (
    <div className="page-width">
      <h1 className="sr-only">공연 목록</h1>
      {isAuthenticated && (nextPlan || pastPlans.length > 0 || recent?.content.length) ? <div className="border-b border-line-base py-4 text-sm space-y-2">
        {nextPlan && <p>다음 관람 · <Link to="/plans" className="text-action">{nextPlan.watchedDate} {nextPlan.showTitle}</Link></p>}
        {pastPlans.length > 0 && <p><Link to="/plans" className="text-action">관람 기록을 남길 일정 {pastPlans.length}개</Link></p>}
        {recent?.content[0] && <p>최근 기록 · <Link to="/diary" className="text-action">{recent.content[0].showTitle}</Link> · <Link to={`/diary?month=${localDate().slice(0, 7)}`} className="text-action">월간 카드</Link></p>}
      </div> : null}
      <div className="feed-toolbar">
        <nav className="text-tabs" aria-label="공연 일정">
          {([
            ['ongoing', '공연 중'],
            ['upcoming', '개막 예정'],
            ['today', '오늘 시간표'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={collection === value}
              onClick={() => setCollection(value)}
              className={collection === value ? 'is-active' : ''}
            >
              {label}
            </button>
          ))}
        </nav>
        <nav className="text-tabs genre-tabs" aria-label="장르">
          {GENRES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={genre === value}
              onClick={() => setGenre(value)}
              className={genre === value ? 'is-active' : ''}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {collection === 'today' ? <TodayScheduleSection key={genre} genre={genre} /> : (
        <div className="feed-list" aria-label="공연 목록">
          {isLoading ? <p className="feed-notice" role="status">불러오는 중...</p>
            : isError ? <div className="feed-notice">
                <p>공연 정보를 불러오지 못했습니다.</p>
                <button onClick={() => refetch()} className="text-action">다시 시도</button>
              </div>
            : data?.length ? data.map((show, index) => (
                <ShowCard key={show.id} show={show} index={index} />
              ))
            : <p className="feed-notice">등록된 공연이 없습니다.</p>}
        </div>
      )}

      <div className="feed-more">
        <Link to={`/shows?status=${collection === 'upcoming' ? 'UPCOMING' : 'ONGOING'}${genre ? `&genre=${genre}` : ''}`}>공연 더 보기</Link>
      </div>
      {sourceStatus && <details className="mt-6 text-xs text-ink-lighter"><summary className="cursor-pointer">공연 정보 출처·갱신 상태</summary><p className="mt-2">{sourceStatus.source} · {sourceStatus.lastSyncStatus} · {sourceStatus.lastSyncTime}</p><p className="mt-1">{sourceStatus.rankingBasis}</p><p className="mt-1">순위 갱신: {sourceStatus.rankingStatus}</p></details>}
      <footer className="site-footer">
        <Link to="/shows">공연 검색</Link>
        <Link to="/diary">내 기록</Link>
        <span>공연 정보 KOPIS</span>
      </footer>
    </div>
  )
}
