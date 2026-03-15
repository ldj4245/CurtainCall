import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, MessageSquareText, Users } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import PopularShows from '../../components/show/PopularShows'
import RecentCompanions from '../../components/companion/RecentCompanions'
import ShowCard from '../../components/show/ShowCard'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry } from '../../types'
import { getDiaryReminder, getThisMonthDiaryCount } from '../../utils/diaryReminder'

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>()

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

  const featuredShow = ongoingShows?.find((show) => show.posterUrl)
  const secondaryFeaturedShow = ongoingShows?.find((show) => show.posterUrl && show.id !== featuredShow?.id)
  const recentEntry = recentDiaryPage?.content?.[0]
  const reminder = getDiaryReminder(stats, recentEntry)
  const thisMonthCount = getThisMonthDiaryCount(stats)
  const averageRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '-'

  const guestReasons = useMemo(
    () => [
      {
        icon: <BookOpen className="h-5 w-5 text-brand" />,
        title: '다이어리',
        description: '본 공연의 날짜, 평점, 메모를 한곳에 남길 수 있습니다.',
      },
      {
        icon: <Users className="h-5 w-5 text-brand" />,
        title: '동행',
        description: '같은 공연을 볼 사람을 찾고 바로 채팅으로 이어집니다.',
      },
      {
        icon: <MessageSquareText className="h-5 w-5 text-brand" />,
        title: '후기',
        description: '짧은 감상부터 리뷰까지 공연을 본 뒤의 이야기를 남길 수 있습니다.',
      },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand">
                {isAuthenticated ? `${user?.nickname ?? '회원'}님의 관극 기록` : '공연을 보고 난 뒤의 기록'}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {isAuthenticated ? '오늘 본 공연을 바로 남겨두세요' : '본 공연을 남기고 다시 찾아보세요'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                {isAuthenticated
                  ? '최근 기록과 이번 달 관극 흐름을 한눈에 보고, 공연 상세에서 바로 기록과 후기를 이어갈 수 있습니다.'
                  : '공연을 찾고, 동행을 구하고, 관람한 공연을 다이어리와 후기 형태로 차곡차곡 남길 수 있습니다.'}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setEditEntry(undefined)
                      setShowDiaryForm(true)
                    }}
                    className="btn-primary justify-center px-6 py-3"
                  >
                    오늘 기록하기
                  </button>
                ) : (
                  <Link to="/shows" className="btn-primary justify-center px-6 py-3">
                    공연 찾기
                  </Link>
                )}
                <Link
                  to={isAuthenticated ? '/shows' : '/signup'}
                  className="btn-secondary justify-center px-6 py-3"
                >
                  {isAuthenticated ? '공연 찾기' : '회원가입'}
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="mt-8 space-y-4">
                  {reminder ? (
                    <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
                      <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{reminder.description}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="card p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">최근 기록</p>
                          <p className="mt-1 text-sm text-gray-500">
                            최근에 남긴 공연 기록을 이어서 볼 수 있습니다.
                          </p>
                        </div>
                        <Link to="/diary" className="text-sm font-medium text-brand hover:underline">
                          전체 보기
                        </Link>
                      </div>

                      {recentEntry ? (
                        <div className="mt-4 rounded-2xl border border-gray-100 bg-warm-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-semibold text-gray-900">{recentEntry.showTitle}</p>
                              <p className="mt-1 text-sm text-gray-500">{recentEntry.watchedDate}</p>
                            </div>
                            <button
                              onClick={() => {
                                setEditEntry(recentEntry)
                                setShowDiaryForm(true)
                              }}
                              className="text-sm font-medium text-brand hover:underline"
                            >
                              수정
                            </button>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-700">
                            {recentEntry.comment || '아직 감상 메모가 없습니다.'}
                          </p>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Link
                              to={`/shows/${recentEntry.showId}`}
                              className="btn-secondary justify-center px-4 py-2.5 text-sm"
                            >
                              공연 다시 보기
                            </Link>
                            <button
                              onClick={() => {
                                setEditEntry(recentEntry)
                                setShowDiaryForm(true)
                              }}
                              className="btn-secondary justify-center px-4 py-2.5 text-sm"
                            >
                              기록 이어쓰기
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          아직 남긴 기록이 없습니다. 오늘 본 공연부터 짧게 남겨보세요.
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                      <SummaryCard label="이번 달 관극" value={`${thisMonthCount}회`} />
                      <SummaryCard label="총 기록 수" value={`${stats?.totalCount ?? 0}개`} />
                      <SummaryCard label="평균 평점" value={averageRating} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {guestReasons.map((reason) => (
                    <div key={reason.title} className="rounded-2xl border border-gray-100 bg-white p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                        {reason.icon}
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">{reason.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{reason.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {featuredShow ? (
              <div className="flex items-end gap-4 lg:justify-end">
                {secondaryFeaturedShow ? (
                  <Link to={`/shows/${secondaryFeaturedShow.id}`} className="hidden w-28 shrink-0 md:block">
                    <img
                      src={secondaryFeaturedShow.posterUrl ?? ''}
                      alt={secondaryFeaturedShow.title}
                      className="aspect-[3/4] w-full rounded-2xl object-cover shadow-card-md"
                    />
                  </Link>
                ) : null}

                <Link to={`/shows/${featuredShow.id}`} className="w-40 shrink-0 md:w-56">
                  <img
                    src={featuredShow.posterUrl ?? ''}
                    alt={featuredShow.title}
                    className="aspect-[3/4] w-full rounded-2xl object-cover shadow-card-lg"
                  />
                  <p className="mt-3 truncate text-sm font-medium text-gray-700">{featuredShow.title}</p>
                </Link>
              </div>
            ) : null}
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
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">지금 공연 중인 작품</h2>
            <Link
              to="/shows?status=ONGOING"
              className="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand"
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

      {showDiaryForm ? (
        <DiaryFormModal
          entry={editEntry}
          onClose={() => {
            setShowDiaryForm(false)
            setEditEntry(undefined)
          }}
          onSaved={() => {
            setShowDiaryForm(false)
            setEditEntry(undefined)
          }}
        />
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
