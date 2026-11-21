import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { showsApi } from '../../api/shows'
import { communityApi } from '../../api/community'
import { retentionApi } from '../../api/retention'
import { useAuthStore } from '../../store/authStore'
import { diaryApi } from '../../api/diary'
import { localDate } from '../../utils/analytics'
import type { Show } from '../../types'
import ShowCard from '../../components/show/ShowCard'
import TodayScheduleSection from '../../components/show/TodayScheduleSection'
import { formatCommunityDate } from '../Community/constants'

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

function formatShortDDay(endDate?: string): string {
  if (!endDate) return ''
  const [y, m, d] = endDate.split('-').map(Number)
  if (!y || !m || !d) return ''
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  const endUtc = Date.UTC(y, m - 1, d)
  const diffDays = Math.round((endUtc - todayUtc) / 86400000)
  if (diffDays === 0) return '오늘 막공'
  if (diffDays > 0 && diffDays <= 30) return `D-${diffDays}`
  return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`
}

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

function ShowFeedSkeleton() {
  return (
    <div className="feed-list animate-pulse" aria-label="공연 목록 불러오는 중">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="feed-item">
          <div className="w-6 h-4 bg-[#eceae6] mt-1 shrink-0" />
          <div className="feed-thumb bg-[#eceae6] border-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-4 w-3/5 bg-[#eceae6]" />
            <div className="h-3 w-4/5 bg-[#eceae6]" />
            <div className="h-3 w-1/2 bg-[#eceae6]" />
          </div>
        </div>
      ))}
    </div>
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

  const { data: recentCommunity } = useQuery({
    queryKey: ['community-posts', 'home-recent'],
    queryFn: () => communityApi.getPosts({ size: 5 }),
    staleTime: 30_000,
  })

  const { data: endingSoonRail = [] } = useQuery({
    queryKey: ['shows', 'home-ending-rail'],
    queryFn: () => showsApi.getEndingSoon(5),
    staleTime: 60_000,
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
      <h1 className="sr-only">커튼콜 공연 목록</h1>

      {isAuthenticated ? (
        <div className="border-b border-line-base py-3 text-[12px] text-[#444] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {nextPlan ? (
              <span>
                <strong className="font-semibold text-[#111]">다음 관람</strong>{' '}
                <Link to="/plans" className="text-action !min-h-0">{nextPlan.watchedDate} {nextPlan.showTitle}</Link>
              </span>
            ) : null}
            {pastPlans.length > 0 && (
              <Link to="/plans" className="text-action !min-h-0">관람 기록 남길 일정 {pastPlans.length}개</Link>
            )}
            {recent?.content[0] ? (
              <span>
                <strong className="font-semibold text-[#111]">최근 기록</strong>{' '}
                <Link to="/diary" className="text-action !min-h-0">{recent.content[0].showTitle}</Link>
                <span className="mx-1.5 text-[#ccc]">·</span>
                <Link to={`/diary?month=${localDate().slice(0, 7)}`} className="text-action !min-h-0">월간 카드</Link>
              </span>
            ) : !nextPlan && pastPlans.length === 0 ? (
              <span className="text-[#666]">관람 예정 일정과 관극 기록을 한곳에 정리해 보세요.</span>
            ) : null}
          </div>
          <Link to="/diary?compose=1" className="button-primary !min-h-[30px] !py-1 !px-2.5 shrink-0">
            기록하기
          </Link>
        </div>
      ) : (
        <div className="border-b border-line-base py-3 text-[12px] text-[#555] flex flex-wrap items-center justify-between gap-2">
          <p>뮤지컬·연극 공연 일정, 좌석 시야 후기, 개인 관극 기록을 한곳에서 정리합니다.</p>
          <Link to="/diary?compose=1" className="text-action !min-h-0 font-medium text-[#111] shrink-0">
            내 기록 시작하기 →
          </Link>
        </div>
      )}

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

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-10 items-start pb-6">
        <div className="min-w-0">
          {collection === 'today' ? (
            <TodayScheduleSection key={genre} genre={genre} />
          ) : activeQuery.isLoading ? (
            <ShowFeedSkeleton />
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
            <details className="mt-2 text-xs text-ink-lighter">
              <summary className="cursor-pointer">공연 정보 출처·갱신 상태</summary>
              <p className="mt-2">{sourceStatus.source} · {sourceStatus.lastSyncStatus} · {sourceStatus.lastSyncTime}</p>
              <p className="mt-1">{sourceStatus.rankingBasis}</p>
              <p className="mt-1">순위 갱신: {sourceStatus.rankingStatus}</p>
            </details>
          )}
        </div>

        <aside className="space-y-6 mt-8 pt-6 border-t border-line-base lg:mt-0 lg:pt-0 lg:border-t-0" aria-label="커뮤니티 및 막공 요약">
          <section className="bg-white border border-line-base p-4">
            <div className="flex items-baseline justify-between pb-2.5 border-b border-[#efefef]">
              <h2 className="text-[13px] font-semibold text-[#141414]">커뮤니티 최근 글</h2>
              <Link to="/community" className="text-[12px] text-[#777] hover:text-[#141414] hover:underline">전체 보기</Link>
            </div>
            {recentCommunity?.content.length ? (
              <ul className="divide-y divide-[#f2f2f2]">
                {recentCommunity.content.map((post) => (
                  <li key={post.id} className="py-2.5">
                    <Link to={`/community/${post.id}`} className="block group">
                      <div className="text-[13px] text-[#141414] leading-snug group-hover:underline">
                        <span className="text-[11px] text-[#888] mr-1">{post.categoryDisplayName}</span>
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="text-[11px] text-[#666] ml-1 tabular-nums">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-[#999] flex items-center gap-1.5 truncate">
                        <span>{post.authorNickname}</span>
                        <span>·</span>
                        <span>{formatCommunityDate(post.createdAt)}</span>
                        {post.showTitle && (
                          <>
                            <span>·</span>
                            <span className="truncate">{post.showTitle}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-[12px] text-[#888] space-y-2">
                <p>아직 등록된 글이 없습니다.</p>
                <Link to="/community/new" className="text-action !min-h-0 font-medium text-[#111]">첫 글 남기기</Link>
              </div>
            )}
          </section>

          {endingSoonRail.length > 0 && (
            <section className="bg-white border border-line-base p-4">
              <div className="flex items-baseline justify-between pb-2.5 border-b border-[#efefef]">
                <h2 className="text-[13px] font-semibold text-[#141414]">이번 주 막공 임박</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCollection('ending')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="text-[12px] text-[#777] hover:text-[#141414] hover:underline"
                >
                  더 보기
                </button>
              </div>
              <ul className="divide-y divide-[#f2f2f2]">
                {endingSoonRail.map((show) => (
                  <li key={show.id} className="py-2.5 flex items-baseline justify-between gap-2">
                    <Link to={`/shows/${show.id}`} className="text-[12px] text-[#222] hover:underline truncate">
                      {show.title}
                    </Link>
                    <span className="text-[11px] font-semibold text-[#8b1e2d] shrink-0 tabular-nums">
                      {formatShortDDay(show.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <footer className="site-footer">
        <Link to="/shows">공연 검색</Link>
        <Link to="/community">커뮤니티</Link>
        <Link to="/diary">내 기록</Link>
        <span>공연 정보 KOPIS</span>
      </footer>
    </div>
  )
}
