import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, MessageSquareText, PenSquare, Users } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import StarRating from '../../components/common/StarRating'
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

  const recentEntry = recentDiaryPage?.content?.[0]
  const featuredShow = ongoingShows?.find((show) => show.posterUrl)
  const reminder = getDiaryReminder(stats, recentEntry)
  const thisMonthCount = getThisMonthDiaryCount(stats)
  const averageRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '-'
  const topShow = stats?.topShows?.[0]

  const flowSteps = useMemo(
    () => [
      {
        title: '공연 찾기',
        description: '보고 싶은 작품을 찾고 상세에서 바로 이동합니다.',
        icon: <BookOpen className="h-4 w-4 text-brand" />,
      },
      {
        title: '기록 남기기',
        description: '관람일, 별점, 짧은 감상을 가볍게 저장합니다.',
        icon: <PenSquare className="h-4 w-4 text-brand" />,
      },
      {
        title: '후기와 동행',
        description: '후기를 읽고 동행을 찾아 다음 관극으로 이어갑니다.',
        icon: <Users className="h-4 w-4 text-brand" />,
      },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand">
                {isAuthenticated ? `${user?.nickname ?? '회원'}님의 기록 홈` : '관극 기록 서비스'}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {isAuthenticated ? '오늘 본 공연을 바로 남겨두세요' : '공연 보고 끝나지 않게'}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                {isAuthenticated
                  ? '최근 기록과 이번 달 관극 흐름을 한눈에 보고, 공연 상세에서 기록과 후기까지 바로 이어갈 수 있습니다.'
                  : '본 공연의 날짜와 평점, 짧은 감상을 남기고 후기를 읽고 동행까지 이어갈 수 있습니다.'}
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
                  to={isAuthenticated ? '/diary' : '/signup'}
                  className="btn-secondary justify-center px-6 py-3"
                >
                  {isAuthenticated ? '내 기록 보기' : '회원가입'}
                </Link>
              </div>

              {reminder ? (
                <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{reminder.description}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {flowSteps.map((step) => (
                  <div key={step.title} className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                      {step.icon}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              {isAuthenticated ? (
                <LoggedInPreviewCard
                  recentEntry={recentEntry}
                  thisMonthCount={thisMonthCount}
                  totalCount={stats?.totalCount ?? 0}
                  averageRating={averageRating}
                  topShowTitle={topShow?.showTitle}
                  onEditRecent={() => {
                    if (!recentEntry) return
                    setEditEntry(recentEntry)
                    setShowDiaryForm(true)
                  }}
                />
              ) : (
                <GuestPreviewCard featuredShow={featuredShow} />
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

function LoggedInPreviewCard({
  recentEntry,
  thisMonthCount,
  totalCount,
  averageRating,
  topShowTitle,
  onEditRecent,
}: {
  recentEntry?: DiaryEntry
  thisMonthCount: number
  totalCount: number
  averageRating: string
  topShowTitle?: string
  onEditRecent: () => void
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-card-md md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">최근 기록 미리보기</p>
          <p className="mt-1 text-sm text-gray-500">공연 상세에서 남긴 기록이 이곳에 쌓입니다.</p>
        </div>
        <BookOpen className="h-5 w-5 text-brand" />
      </div>

      {recentEntry ? (
        <div className="mt-5 rounded-2xl border border-gray-100 bg-warm-50 p-4">
          <div className="flex gap-4">
            {recentEntry.showPosterUrl ? (
              <img
                src={recentEntry.showPosterUrl}
                alt={recentEntry.showTitle}
                className="h-28 w-20 shrink-0 rounded-xl object-cover"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-gray-900">{recentEntry.showTitle}</p>
              <p className="mt-1 text-sm text-gray-500">{recentEntry.watchedDate}</p>
              <div className="mt-3 flex items-center gap-2">
                <StarRating value={recentEntry.rating} readonly size="sm" />
                <span className="text-sm font-medium text-gray-700">{recentEntry.rating.toFixed(1)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-700">
                {recentEntry.comment || '아직 남긴 메모가 없습니다.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to={`/shows/${recentEntry.showId}`} className="btn-secondary justify-center px-4 py-2.5 text-sm">
              공연 다시 보기
            </Link>
            <button onClick={onEditRecent} className="btn-secondary justify-center px-4 py-2.5 text-sm">
              기록 이어쓰기
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          아직 남긴 기록이 없습니다. 오늘 본 공연부터 가볍게 남겨보세요.
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStat label="이번 달 관극" value={`${thisMonthCount}회`} />
        <PreviewStat label="총 기록 수" value={`${totalCount}개`} />
        <PreviewStat label="평균 평점" value={averageRating} />
        <PreviewStat label="많이 본 작품" value={topShowTitle || '아직 없음'} compact />
      </div>
    </div>
  )
}

function GuestPreviewCard({
  featuredShow,
}: {
  featuredShow?: { title: string; posterUrl?: string; theaterName?: string }
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-card-md md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">기록 예시</p>
          <p className="mt-1 text-sm text-gray-500">공연을 보고 날짜와 별점, 짧은 감상을 남길 수 있습니다.</p>
        </div>
        <MessageSquareText className="h-5 w-5 text-brand" />
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-warm-50 p-4">
        <div className="flex gap-4">
          {featuredShow?.posterUrl ? (
            <img
              src={featuredShow.posterUrl}
              alt={featuredShow.title}
              className="h-28 w-20 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="h-28 w-20 shrink-0 rounded-xl bg-white" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400">공연</p>
            <p className="truncate text-lg font-semibold text-gray-900">
              {featuredShow?.title || '공연 제목'}
            </p>
            <p className="mt-1 text-sm text-gray-500">{featuredShow?.theaterName || '공연장 정보'}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <InfoLine label="관람일" value="2026-03-15" />
              <InfoLine label="별점" value="4.5 / 5" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white px-4 py-4">
          <p className="text-xs font-medium text-gray-400">감상 예시</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            좋았던 장면이나 커튼콜에서 오래 남은 느낌을 짧게 남길 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <GuestReason
          icon={<BookOpen className="h-4 w-4 text-brand" />}
          title="다이어리"
          description="본 공연을 한곳에 차곡차곡 남깁니다."
        />
        <GuestReason
          icon={<Users className="h-4 w-4 text-brand" />}
          title="동행"
          description="같이 볼 사람을 찾아 채팅으로 이어집니다."
        />
        <GuestReason
          icon={<MessageSquareText className="h-4 w-4 text-brand" />}
          title="후기"
          description="짧은 감상부터 리뷰까지 남길 수 있습니다."
        />
      </div>
    </div>
  )
}

function PreviewStat({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-2 font-semibold text-gray-900 ${compact ? 'line-clamp-2 text-sm leading-6' : 'text-lg'}`}>
        {value}
      </p>
    </div>
  )
}

function GuestReason({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">{icon}</div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
