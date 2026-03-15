import { useState, type ReactNode } from 'react'
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
import type { DiaryEntry, Show } from '../../types'
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
  const reminder = getDiaryReminder(stats, recentEntry)
  const thisMonthCount = getThisMonthDiaryCount(stats)
  const totalCount = stats?.totalCount ?? 0
  const averageRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '-'
  const topShow = stats?.topShows?.[0]?.showTitle ?? '아직 없음'
  const featuredShow = ongoingShows?.find((show) => show.posterUrl) ?? ongoingShows?.[0]

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand">
                {isAuthenticated ? `${user?.nickname ?? '사용자'}님의 관극 기록` : '공연 기록 서비스'}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                {isAuthenticated ? '본 공연을 계속 남겨두세요.' : '본 공연, 남겨두세요.'}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                {isAuthenticated
                  ? '관람일, 별점, 짧은 감상만 적어도 기록이 쌓입니다. 최근 기록과 이번 달 관극 흐름도 바로 볼 수 있습니다.'
                  : '관람일, 별점, 한 줄 감상만 적어도 기록이 쌓입니다. 공연을 보고 지나가지 않게 남겨보세요.'}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setEditEntry(undefined)
                      setShowDiaryForm(true)
                    }}
                    className="btn-primary justify-center px-6 py-3"
                  >
                    기록 시작하기
                  </button>
                ) : (
                  <Link to="/shows" className="btn-primary justify-center px-6 py-3">
                    공연 둘러보기
                  </Link>
                )}

                <Link
                  to={isAuthenticated ? '/diary' : '/signup'}
                  className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-brand sm:justify-start"
                >
                  {isAuthenticated ? '내 기록 보기' : '회원가입'} <ChevronRight size={16} />
                </Link>
              </div>

              {reminder ? (
                <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{reminder.description}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard label="이번 달 관극" value={`${thisMonthCount}회`} />
                <MetricCard label="총 기록 수" value={`${totalCount}개`} />
                <MetricCard label="평균 별점" value={averageRating} />
              </div>
            </div>

            <div className="min-w-0">
              {isAuthenticated ? (
                <LoggedInRecordPreview
                  recentEntry={recentEntry}
                  topShowTitle={topShow}
                  onContinue={() => {
                    if (!recentEntry) {
                      setEditEntry(undefined)
                    } else {
                      setEditEntry(recentEntry)
                    }
                    setShowDiaryForm(true)
                  }}
                />
              ) : (
                <GuestRecordPreview featuredShow={featuredShow} />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">기록은 이렇게 이어집니다</h2>
              <p className="mt-1 text-sm text-gray-500">공연을 찾고, 남기고, 다음 관극으로 이어집니다.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SimpleStep
              icon={<BookOpen className="h-4 w-4 text-brand" />}
              title="공연 찾기"
              description="보고 싶은 작품을 찾고 상세 페이지로 들어갑니다."
            />
            <SimpleStep
              icon={<PenSquare className="h-4 w-4 text-brand" />}
              title="기록 남기기"
              description="관람일, 별점, 한 줄 감상만으로도 충분합니다."
            />
            <SimpleStep
              icon={<Users className="h-4 w-4 text-brand" />}
              title="후기와 동행"
              description="기록 뒤에 후기를 남기고 다음 관극도 이어갈 수 있습니다."
            />
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

function LoggedInRecordPreview({
  recentEntry,
  topShowTitle,
  onContinue,
}: {
  recentEntry?: DiaryEntry
  topShowTitle: string
  onContinue: () => void
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-card-md md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">최근 기록</p>
          <p className="mt-1 text-sm text-gray-500">가장 최근에 남긴 공연 기록입니다.</p>
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
                {recentEntry.comment || '짧은 감상은 아직 남기지 않았습니다.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3">
            <div>
              <p className="text-xs text-gray-400">가장 많이 본 작품</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{topShowTitle}</p>
            </div>
            <button onClick={onContinue} className="btn-secondary px-4 py-2 text-sm">
              이어서 기록
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          아직 남긴 기록이 없습니다. 첫 기록부터 가볍게 시작해 보세요.
          <div className="mt-4">
            <button onClick={onContinue} className="btn-primary px-5 py-2.5">
              첫 기록 남기기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function GuestRecordPreview({ featuredShow }: { featuredShow?: Show }) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-card-md md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">기록 예시</p>
          <p className="mt-1 text-sm text-gray-500">공연을 보고 남기게 될 기록 모습입니다.</p>
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
            <p className="truncate text-lg font-semibold text-gray-900">{featuredShow?.title || '공연 제목'}</p>
            <p className="mt-1 text-sm text-gray-500">{featuredShow?.theaterName || '공연장 정보'}</p>
            <div className="mt-3 flex items-center gap-2">
              <StarRating value={5} readonly size="sm" />
              <span className="text-sm font-medium text-gray-700">4.5</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-700">
              좋았던 장면이나 커튼콜에서 오래 남은 감정을 짧게 남겨둘 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PreviewInfo label="관람일" value="2026.03.15" />
          <PreviewInfo label="좌석" value="1층 B구역" />
          <PreviewInfo label="기록" value="한 줄 감상" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function SimpleStep({
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

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
