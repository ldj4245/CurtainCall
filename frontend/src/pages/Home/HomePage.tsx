import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, ChevronRight, MessageCircle, Users } from 'lucide-react'
import { showsApi } from '../../api/shows'
import { diaryApi } from '../../api/diary'
import ShowCard from '../../components/show/ShowCard'
import PopularShows from '../../components/show/PopularShows'
import RecentCompanions from '../../components/companion/RecentCompanions'
import { useAuthStore } from '../../store/authStore'

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="paper-panel p-5">
      <p className="journal-kicker">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{hint}</p>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()

  const { data: ongoingShows, isLoading } = useQuery({
    queryKey: ['shows', 'ongoing'],
    queryFn: () => showsApi.getOngoing(8),
  })

  const { data: stats } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
    enabled: isAuthenticated,
  })

  const { data: recentDiaryPage } = useQuery({
    queryKey: ['diary', 'me', 'recent-home'],
    queryFn: () => diaryApi.getMyDiary(0, 1),
    enabled: isAuthenticated,
  })

  const featuredShow = ongoingShows?.find((show) => show.posterUrl) ?? ongoingShows?.[0]
  const supportShows =
    ongoingShows?.filter((show) => show.posterUrl && show.id !== featuredShow?.id).slice(0, 2) ?? []
  const recentDiary = recentDiaryPage?.content?.[0]

  return (
    <div className="min-h-screen bg-white">
      <section className="journal-hero border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
            <div className="min-w-0">
              <p className="journal-kicker">
                {isAuthenticated ? `${user?.nickname ?? '사용자'}의 관극 기록` : '공연을 보고 나면 기록도 남겨보세요'}
              </p>
              <h1 className="mt-3 max-w-3xl text-[2.2rem] font-black leading-[1.05] tracking-[-0.04em] text-gray-900 sm:text-5xl">
                공연을 찾고,
                <br />
                보고 난 감상을 남겨두세요
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                공연 정보만 보는 곳이 아니라, 본 공연을 기록하고 동행을 찾고 후기를 이어서 확인할 수 있는
                흐름에 집중했습니다.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={isAuthenticated ? '/diary' : '/signup'}
                  className="btn-primary w-full justify-between px-5 py-3 sm:w-auto sm:justify-center"
                >
                  <span>{isAuthenticated ? '오늘 기록하기' : '기록 시작하기'}</span>
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  to="/shows"
                  className="btn-secondary w-full justify-between px-5 py-3 sm:w-auto sm:justify-center"
                >
                  <span>공연 찾기</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  <SummaryCard
                    label="총 관극 수"
                    value={`${stats?.totalCount ?? 0}회`}
                    hint="지금까지 남긴 기록"
                  />
                  <SummaryCard
                    label="평균 평점"
                    value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                    hint="남겨 둔 감상의 평균"
                  />
                  <SummaryCard
                    label="최근 기록"
                    value={recentDiary?.showTitle ?? '아직 첫 기록 전'}
                    hint={recentDiary ? `${recentDiary.watchedDate} 관람` : '다이어리에서 첫 기록을 남겨보세요'}
                  />
                </div>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <Link to="/signup" className="paper-panel p-5">
                    <BookOpen className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">다이어리</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      관람일, 좌석, 감상, 사진까지 한 곳에 정리할 수 있습니다.
                    </p>
                  </Link>
                  <Link to="/shows" className="paper-panel p-5">
                    <Users className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">동행</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      공연 상세에서 바로 동행을 찾고 채팅으로 이어질 수 있습니다.
                    </p>
                  </Link>
                  <Link to="/shows" className="paper-panel p-5">
                    <MessageCircle className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">후기</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      보고 난 뒤의 감상을 리뷰로 남기고 다른 관객의 후기도 볼 수 있습니다.
                    </p>
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {featuredShow && (
                <Link to={`/shows/${featuredShow.id}`} className="ticket-panel block overflow-hidden p-4">
                  <div className="flex gap-4">
                    {featuredShow.posterUrl ? (
                      <img
                        src={featuredShow.posterUrl}
                        alt={featuredShow.title}
                        className="h-40 w-28 rounded-2xl object-cover shadow-card-md sm:h-48 sm:w-32"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="journal-kicker">추천 공연</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                        {featuredShow.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-gray-500">
                        공연 상세에서 기록, 동행, 후기를 한 번에 이어서 볼 수 있습니다.
                      </p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                        공연 상세 보기
                        <ArrowUpRight size={15} />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {recentDiary ? (
                <Link to="/diary" className="paper-panel block p-5">
                  <p className="journal-kicker">최근 기록</p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-gray-900">{recentDiary.showTitle}</p>
                      <p className="mt-1 text-sm text-gray-500">{recentDiary.watchedDate}</p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                        {recentDiary.comment || '기록을 이어서 수정하거나 다시 읽어볼 수 있습니다.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-brand/15 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                      보기
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="paper-panel p-5">
                  <p className="journal-kicker">시작하기</p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">첫 관극 기록을 남겨보세요</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    별점과 한 줄 감상만으로도 충분합니다. 필요한 정보는 나중에 더 추가할 수 있습니다.
                  </p>
                </div>
              )}

              {supportShows.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {supportShows.map((show) => (
                    <Link key={show.id} to={`/shows/${show.id}`} className="paper-panel p-3">
                      {show.posterUrl ? (
                        <img
                          src={show.posterUrl}
                          alt={show.title}
                          className="aspect-[3/4] w-full rounded-xl object-cover"
                        />
                      ) : null}
                      <p className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900">{show.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <PopularShows />
        </div>
      </section>

      <section className="bg-warm-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <RecentCompanions />
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="journal-kicker">진행 중인 공연</p>
              <h2 className="section-title mt-1 text-2xl">지금 바로 볼 수 있는 작품</h2>
            </div>
            <Link
              to="/shows?status=ONGOING"
              className="hidden items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-brand sm:flex"
            >
              전체 보기 <ChevronRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-2xl bg-warm-100" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-warm-100" />
                    <div className="h-3 w-1/2 rounded bg-warm-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {ongoingShows?.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
