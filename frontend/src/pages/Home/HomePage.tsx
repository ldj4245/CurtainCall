import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, ChevronRight, MapPin, PenSquare, Star, Users } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import StarRating from '../../components/common/StarRating'
import ShowCard from '../../components/show/ShowCard'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry, Show } from '../../types'
import { getDiaryReminder, getThisMonthDiaryCount } from '../../utils/diaryReminder'

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>()

  const { data: homeSections, isLoading: isHomeSectionsLoading } = useQuery({
    queryKey: ['shows', 'home-sections'],
    queryFn: () => showsApi.getHomeSections(8),
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
  const rankedShows = homeSections?.popular ?? []
  const featuredShow = rankedShows.find((show) => show.posterUrl) ?? rankedShows[0]

  return (
    <div className="min-h-screen bg-warm-50/50">
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand">
                {isAuthenticated ? `${user?.nickname ?? '사용자'}님의 관극 홈` : '공연을 찾고 기록하는 곳'}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                오늘 볼 공연을 고르고,
                <br className="hidden md:block" /> 본 공연은 남겨두세요.
              </h1>
            </div>
            <Link
              to="/shows"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-brand"
            >
              공연 전체 보기 <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_380px]">
            <FeaturedShowCard show={featuredShow} />
            <QuickRecordCard
              isAuthenticated={isAuthenticated}
              recentEntry={recentEntry}
              topShowTitle={topShow}
              onStart={() => {
                setEditEntry(undefined)
                setShowDiaryForm(true)
              }}
              onContinue={() => {
                setEditEntry(recentEntry)
                setShowDiaryForm(true)
              }}
            />
          </div>

          {reminder ? (
            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
              <p className="mt-1 text-sm text-gray-600">{reminder.description}</p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricCard label="이번 달 관극" value={`${thisMonthCount}회`} />
            <MetricCard label="총 기록 수" value={`${totalCount}개`} />
            <MetricCard label="평균 별점" value={averageRating} />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-12">
        <div className="mx-auto max-w-6xl space-y-12">
          <CuratedShowSection
            eyebrow="KOPIS 기준"
            title="KOPIS 인기 공연"
            description="박스오피스 흐름을 기준으로 지금 많이 찾는 공연입니다."
            shows={homeSections?.popular ?? []}
            isLoading={isHomeSectionsLoading}
          />
          <CuratedShowSection
            eyebrow="마감 임박"
            title="곧 끝나는 공연"
            description="놓치기 전에 확인해볼 만한 공연입니다."
            shows={homeSections?.endingSoon ?? []}
            isLoading={isHomeSectionsLoading}
            badge={(show) => getDaysLeftLabel(show.endDate)}
          />
          <CuratedShowSection
            eyebrow="새로 시작"
            title="이번 달 개막"
            description="이번 달 새롭게 막을 올리는 공연입니다."
            shows={homeSections?.openingThisMonth ?? []}
            isLoading={isHomeSectionsLoading}
          />
          <CuratedShowSection
            eyebrow="CurtainCall 기록"
            title="기록 많은 공연"
            description="사용자들이 관극 기록을 많이 남긴 공연입니다."
            shows={homeSections?.mostRecorded ?? []}
            isLoading={isHomeSectionsLoading}
            badge={(show) => (show.diaryCount ? `기록 ${show.diaryCount}개` : undefined)}
          />
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

function FeaturedShowCard({ show }: { show?: Show }) {
  if (!show) {
    return (
      <div className="rounded-[28px] border border-gray-100 bg-warm-50 p-6">
        <p className="text-sm font-semibold text-brand">오늘의 공연</p>
        <h2 className="mt-3 text-2xl font-bold text-gray-900">공연 데이터를 불러오는 중입니다.</h2>
      </div>
    )
  }

  return (
    <Link
      to={`/shows/${show.id}`}
      className="group grid overflow-hidden rounded-[28px] border border-gray-100 bg-gray-950 text-white shadow-card-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-md md:grid-cols-[260px_minmax(0,1fr)]"
    >
      <div className="relative bg-gray-900">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
            alt={show.title}
            className="aspect-[4/5] h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.03] md:aspect-auto"
          />
        ) : (
          <div className="flex aspect-[4/5] h-full w-full items-center justify-center bg-gray-900 text-sm text-gray-500">
            포스터 준비 중
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-900">
          오늘 많이 찾는 공연
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-between p-6 md:p-8">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{show.statusDisplayName}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{show.genreDisplayName}</span>
          </div>
          <h2 className="mt-5 line-clamp-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{show.title}</h2>

          <div className="mt-5 space-y-2 text-sm text-white/70">
            {show.theaterName ? (
              <p className="flex items-center gap-2">
                <MapPin size={15} />
                <span className="truncate">{show.theaterName}</span>
              </p>
            ) : null}
            {show.startDate ? (
              <p className="flex items-center gap-2">
                <CalendarDays size={15} />
                <span>
                  {show.startDate} ~ {show.endDate || '미정'}
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Star size={15} className="fill-gold text-gold" />
            {show.averageScore ? `${show.averageScore.toFixed(1)}점` : '상세에서 기록 시작'}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-white">
            상세 보기 <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function QuickRecordCard({
  isAuthenticated,
  recentEntry,
  topShowTitle,
  onStart,
  onContinue,
}: {
  isAuthenticated: boolean
  recentEntry?: DiaryEntry
  topShowTitle: string
  onStart: () => void
  onContinue: () => void
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-card-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">빠른 기록</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">관극 후 바로 남기기</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand">
          <PenSquare size={20} />
        </div>
      </div>

      {isAuthenticated ? (
        <div className="mt-5">
          {recentEntry ? (
            <div className="rounded-2xl border border-gray-100 bg-warm-50 p-4">
              <p className="text-xs font-semibold text-gray-400">최근 기록</p>
              <p className="mt-2 line-clamp-2 font-semibold text-gray-900">{recentEntry.showTitle}</p>
              <div className="mt-3 flex items-center gap-2">
                <StarRating value={recentEntry.rating} readonly size="sm" />
                <span className="text-sm font-semibold text-gray-700">{recentEntry.rating.toFixed(1)}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                {recentEntry.comment || '짧은 감상은 아직 비어 있습니다.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              아직 기록이 없습니다. 첫 공연부터 남겨보세요.
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">가장 많이 본 작품</p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900">{topShowTitle}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <button onClick={recentEntry ? onContinue : onStart} className="btn-primary justify-center py-3">
              {recentEntry ? '최근 기록 이어쓰기' : '첫 기록 남기기'}
            </button>
            <Link to="/diary" className="btn-secondary justify-center py-3">
              내 다이어리 보기
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="space-y-3">
            <SimpleStep
              icon={<BookOpen className="h-4 w-4 text-brand" />}
              title="공연 상세로 이동"
              description="포스터나 랭킹에서 작품을 고릅니다."
            />
            <SimpleStep
              icon={<PenSquare className="h-4 w-4 text-brand" />}
              title="기록하기"
              description="관람일, 별점, 좌석, 한 줄 감상을 남깁니다."
            />
            <SimpleStep
              icon={<Users className="h-4 w-4 text-brand" />}
              title="동행과 후기"
              description="상세 화면에서 함께 볼 사람과 관객 리뷰를 봅니다."
            />
          </div>
          <Link to="/shows" className="btn-primary mt-5 w-full justify-center py-3">
            공연 둘러보기
          </Link>
        </div>
      )}
    </div>
  )
}

function CuratedShowSection({
  eyebrow,
  title,
  description,
  shows,
  isLoading,
  badge,
}: {
  eyebrow: string
  title: string
  description: string
  shows: Show[]
  isLoading: boolean
  badge?: (show: Show) => string | undefined
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">{eyebrow}</p>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <Link to="/shows" className="hidden items-center gap-1 text-sm font-semibold text-gray-400 hover:text-brand sm:flex">
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
      ) : shows.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {shows.map((show) => {
            const badgeText = badge?.(show)
            return (
              <div key={show.id} className="relative">
                {badgeText ? (
                  <div className="absolute left-3 top-3 z-10 rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    {badgeText}
                  </div>
                ) : null}
                <ShowCard show={show} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
          아직 보여줄 공연이 없습니다.
        </div>
      )}
    </section>
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

function getDaysLeftLabel(endDate?: string) {
  if (!endDate) return undefined

  const today = new Date()
  const end = new Date(`${endDate}T00:00:00`)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = end.getTime() - todayStart.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return undefined
  if (daysLeft === 0) return '오늘 종료'
  return `D-${daysLeft}`
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

