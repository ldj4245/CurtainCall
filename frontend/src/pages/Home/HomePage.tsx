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
  const supportShows = ongoingShows?.filter((show) => show.posterUrl && show.id !== featuredShow?.id).slice(0, 2) ?? []
  const recentDiary = recentDiaryPage?.content?.[0]

  return (
    <div className="min-h-screen bg-white">
      <section className="journal-hero border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-18">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-start">
            <div className="min-w-0">
              <p className="journal-kicker">
                {isAuthenticated ? `${user?.nickname ?? '관극러'}님의 관극 기록` : '공연을 보고 난 뒤를 남기는 곳'}
              </p>
              <h1 className="mt-3 max-w-3xl text-[2.3rem] font-black leading-[1.02] tracking-[-0.04em] text-gray-900 sm:text-5xl md:text-6xl">
                공연은 지나가도
                <br />
                기록은 오래 남아요.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-gray-600 sm:text-base">
                다이어리에 관람일과 감상을 남기고, 마음이 맞는 사람과 동행을 찾고,
                공연이 끝난 뒤 후기로 다시 이야기를 이어가세요.
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
                    hint="지금까지 남긴 기록의 수"
                  />
                  <SummaryCard
                    label="평균 별점"
                    value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                    hint="기록된 감상 기준"
                  />
                  <SummaryCard
                    label="최근 기록"
                    value={recentDiary?.showTitle ?? '아직 첫 기록 전'}
                    hint={recentDiary ? `${recentDiary.watchedDate} 관람` : '첫 관극을 남겨보세요'}
                  />
                </div>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <Link to="/signup" className="paper-panel group p-5">
                    <BookOpen className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">다이어리</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      날짜, 좌석, 감상, 사진까지 한 장의 관극 기록으로 쌓아두세요.
                    </p>
                  </Link>
                  <Link to="/shows" className="paper-panel group p-5">
                    <Users className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">동행</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      보고 싶은 공연에서 바로 동행을 찾고, 채팅으로 약속을 이어갑니다.
                    </p>
                  </Link>
                  <Link to="/shows" className="paper-panel group p-5">
                    <MessageCircle className="h-5 w-5 text-brand" />
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">후기</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      공연 직후의 감정을 리뷰로 남기고 다른 관객의 감상과 비교해보세요.
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
                      <p className="journal-kicker">기록하기 좋은 오늘의 공연</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">
                        {featuredShow.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-gray-500">
                        공연 상세에서 바로 다이어리를 남기고, 동행과 후기까지 이어서 확인할 수 있어요.
                      </p>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                        공연 상세 열기
                        <ArrowUpRight size={15} />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {recentDiary ? (
                <Link to="/diary" className="paper-panel block p-5">
                  <p className="journal-kicker">최근 남긴 기록</p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-gray-900">{recentDiary.showTitle}</p>
                      <p className="mt-1 text-sm text-gray-500">{recentDiary.watchedDate}</p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                        {recentDiary.comment || '짧은 감상을 더 남기면 다음 관극이 더 선명해져요.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-brand/15 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                      다시 보기
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="paper-panel p-5">
                  <p className="journal-kicker">첫 기록 안내</p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">관람일과 별점만으로도 시작할 수 있어요.</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    좌석이나 캐스트 메모는 나중에 덧붙여도 됩니다. 가장 먼저 남겨야 할 건 그날의 감정이에요.
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

      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <PopularShows />
        </div>
      </section>

      <section className="py-12 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          <RecentCompanions />
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="journal-kicker">지금 공연 중</p>
              <h2 className="section-title mt-1 text-2xl">기록으로 이어질 작품들</h2>
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
