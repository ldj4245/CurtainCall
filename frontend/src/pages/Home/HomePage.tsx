import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { showsApi } from '../../api/shows'
import { retentionApi } from '../../api/retention'
import { useAuthStore } from '../../store/authStore'
import { diaryApi } from '../../api/diary'
import { localDate } from '../../utils/analytics'
import type { Show } from '../../types'
import ShowCard from '../../components/show/ShowCard'
import TodayScheduleSection from '../../components/show/TodayScheduleSection'

const GENRES = [
  { value: '', label: '전체' },
  { value: 'MUSICAL', label: '뮤지컬' },
  { value: 'PLAY', label: '연극' },
]

const COLLECTIONS = [
  ['popular', '인기 공연'],
  ['ending', '곧 막공'],
  ['upcoming', '개막 예정'],
  ['today', '오늘 시간표'],
] as const

type CollectionType = (typeof COLLECTIONS)[number][0]

function PopularRankSection({
  heading,
  shows,
  actionLabel,
  onAction,
}: {
  heading?: string
  shows: Show[]
  actionLabel?: string
  onAction?: () => void
}) {
  if (!shows.length) {
    return heading ? null : <p className="feed-notice">등록된 공연이 없습니다.</p>
  }

  return (
    <section className="popular-section">
      {heading && (
        <div className="popular-section-head">
          <h2>{heading}</h2>
          {actionLabel && onAction && (
            <button type="button" onClick={onAction} className="text-action !min-h-0">
              {actionLabel}
            </button>
          )}
        </div>
      )}

      <div className="feed-list" aria-label={heading || '인기 공연 목록'}>
        {shows.map((show, idx) => (
          <ShowCard key={show.id} show={show} rank={show.popularityRank ?? idx + 1} />
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { data: sourceStatus } = useQuery({
    queryKey: ['source-status'],
    queryFn: () => api.get<Record<string, string>>('/shows/data-status').then(r => r.data),
    staleTime: 60000,
  })
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: retentionApi.plans, enabled: isAuthenticated })
  const { data: recent } = useQuery({ queryKey: ['diary', 'home-latest'], queryFn: () => diaryApi.getMyDiary(0, 1), enabled: isAuthenticated })
  const nextPlan = plans.find(p => !p.diaryId && p.watchedDate >= localDate())
  const pastPlans = plans.filter(p => !p.diaryId && p.watchedDate < localDate())

  const [genre, setGenre] = useState('')
  const [collection, setCollection] = useState<CollectionType>('popular')

  const isSplitPopular = collection === 'popular' && genre === ''

  const splitPopularQuery = useQuery({
    queryKey: ['shows', 'home-popular-split'],
    queryFn: async () => {
      const [musical, play] = await Promise.all([
        showsApi.getPopular(10, 'MUSICAL'),
        showsApi.getPopular(10, 'PLAY'),
      ])
      return { musical, play }
    },
    enabled: isSplitPopular,
  })

  const listQuery = useQuery({
    queryKey: ['shows', 'home-feed', collection, genre],
    queryFn: async () => {
      if (collection === 'popular') return showsApi.getPopular(20, genre)
      if (collection === 'ending') return showsApi.getEndingSoon(20, genre)
      return (await showsApi.search({ status: 'UPCOMING', genre, size: 20 })).content
    },
    enabled: collection !== 'today' && !isSplitPopular,
  })

  const activeQuery = isSplitPopular ? splitPopularQuery : listQuery
  const morePath =
    collection === 'popular'
      ? `/shows${genre ? `?genre=${genre}` : ''}`
      : collection === 'upcoming'
        ? `/shows?status=UPCOMING${genre ? `&genre=${genre}` : ''}`
        : `/shows?status=ONGOING${genre ? `&genre=${genre}` : ''}`

  return (
    <div className="page-width">
      <h1 className="sr-only">공연 목록</h1>
      {isAuthenticated && (nextPlan || pastPlans.length > 0 || recent?.content.length) ? (
        <div className="border-b border-line-base py-4 text-sm space-y-2">
          {nextPlan && <p>다음 관람 · <Link to="/plans" className="text-action">{nextPlan.watchedDate} {nextPlan.showTitle}</Link></p>}
          {pastPlans.length > 0 && <p><Link to="/plans" className="text-action">관람 기록을 남길 일정 {pastPlans.length}개</Link></p>}
          {recent?.content[0] && <p>최근 기록 · <Link to="/diary" className="text-action">{recent.content[0].showTitle}</Link> · <Link to={`/diary?month=${localDate().slice(0, 7)}`} className="text-action">월간 카드</Link></p>}
        </div>
      ) : null}

      <div className="feed-toolbar">
        <nav className="text-tabs" aria-label="공연 일정">
          {COLLECTIONS.map(([value, label]) => (
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

      {collection === 'today' ? (
        <TodayScheduleSection key={genre} genre={genre} />
      ) : activeQuery.isLoading ? (
        <p className="feed-notice" role="status">불러오는 중...</p>
      ) : activeQuery.isError ? (
        <div className="feed-notice">
          <p>공연 정보를 불러오지 못했습니다.</p>
          <button type="button" onClick={() => activeQuery.refetch()} className="text-action">다시 시도</button>
        </div>
      ) : collection === 'popular' ? (
        isSplitPopular ? (
          splitPopularQuery.data?.musical.length || splitPopularQuery.data?.play.length ? (
            <>
              <PopularRankSection
                heading="뮤지컬 인기"
                shows={splitPopularQuery.data.musical}
                actionLabel="뮤지컬 20위까지 보기"
                onAction={() => setGenre('MUSICAL')}
              />
              <PopularRankSection
                heading="연극 인기"
                shows={splitPopularQuery.data.play}
                actionLabel="연극 20위까지 보기"
                onAction={() => setGenre('PLAY')}
              />
              <p className="feed-meta mt-3">KOPIS 최근 7일 박스오피스 기준 · 매일 06시 갱신</p>
            </>
          ) : (
            <p className="feed-notice">등록된 공연이 없습니다.</p>
          )
        ) : (
          <>
            <PopularRankSection shows={listQuery.data ?? []} />
            <p className="feed-meta mt-3">KOPIS 최근 7일 박스오피스 기준 · 매일 06시 갱신</p>
          </>
        )
      ) : (
        <div className="feed-list" aria-label="공연 목록">
          {listQuery.data?.length ? listQuery.data.map((show, index) => (
            <ShowCard key={show.id} show={show} index={index} showEndingBadge={collection === 'ending'} />
          )) : (
            <p className="feed-notice">등록된 공연이 없습니다.</p>
          )}
        </div>
      )}

      <div className="feed-more">
        <Link to={morePath}>공연 더 보기</Link>
      </div>
      {sourceStatus && (
        <details className="mt-6 text-xs text-ink-lighter">
          <summary className="cursor-pointer">공연 정보 출처·갱신 상태</summary>
          <p className="mt-2">{sourceStatus.source} · {sourceStatus.lastSyncStatus} · {sourceStatus.lastSyncTime}</p>
          <p className="mt-1">{sourceStatus.rankingBasis}</p>
          <p className="mt-1">순위 갱신: {sourceStatus.rankingStatus}</p>
        </details>
      )}
      <footer className="site-footer">
        <Link to="/shows">공연 검색</Link>
        <Link to="/community">커뮤니티</Link>
        <Link to="/diary">내 기록</Link>
        <span>공연 정보 KOPIS</span>
      </footer>
    </div>
  )
}
