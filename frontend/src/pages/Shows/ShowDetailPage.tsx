import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  DollarSign,
  Heart,
  ImageOff,
  MapPin,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { showsApi } from '../../api/shows'
import { favoritesApi } from '../../api/favorites'
import { companionApi } from '../../api/companion'
import { useAuthStore } from '../../store/authStore'
import StarRating from '../../components/common/StarRating'
import ReviewList from '../../components/review/ReviewList'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import CastingBoard from '../../components/casting/CastingBoard'
import CompanionList from '../../components/companion/CompanionList'
import ShowLiveChat from '../../components/show/ShowLiveChat'

const STATUS_BADGE_CLASS: Record<string, string> = {
  ONGOING: 'badge-ongoing',
  UPCOMING: 'badge-upcoming',
  ENDED: 'badge-ended',
}

const GENRE_BADGE_CLASS: Record<string, string> = {
  MUSICAL: 'badge-musical',
  PLAY: 'badge-play',
}

function StatChip({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'highlight'
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === 'highlight'
          ? 'border-brand/15 bg-brand-50 text-brand'
          : 'border-gray-100 bg-white text-gray-700'
      }`}
    >
      <p className="text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase">{label}</p>
      <p className="mt-2 text-base font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function DetailCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
        <span className="text-gray-400">{icon}</span>
        <span>{value}</span>
      </div>
    </div>
  )
}

function PriceCard({ priceInfo }: { priceInfo?: string }) {
  const lines = priceInfo
    ? priceInfo
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-400">가격 정보</p>
      <div className="mt-2 flex gap-2 text-sm text-gray-700">
        <span className="text-gray-400">
          <DollarSign size={15} />
        </span>
        {lines.length > 0 ? (
          <div className="space-y-1">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <p>정보 없음</p>
        )}
      </div>
    </div>
  )
}

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)

  const infoSectionRef = useRef<HTMLElement | null>(null)
  const companionSectionRef = useRef<HTMLElement | null>(null)
  const reviewSectionRef = useRef<HTMLElement | null>(null)

  const { data: show, isLoading, isError, refetch } = useQuery({
    queryKey: ['show', id],
    queryFn: () => showsApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: favStatus } = useQuery({
    queryKey: ['favorite-status', id],
    queryFn: () => favoritesApi.getStatus(Number(id)),
    enabled: !!id && isAuthenticated,
  })

  const { data: companionSummary } = useQuery({
    queryKey: ['companions', id, 'summary'],
    queryFn: () => companionApi.getCompanions(Number(id), 0, false),
    enabled: !!id,
  })

  const toggleFav = useMutation({
    mutationFn: () => favoritesApi.toggle(Number(id)),
    onSuccess: (data) => {
      queryClient.setQueryData(['favorite-status', id], data)
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success(data.isFavorited ? '찜 목록에 추가했어요.' : '찜 목록에서 제거했어요.')
    },
  })

  const requireLogin = (message: string) => {
    sessionStorage.setItem('postLoginRedirect', `/shows/${id}`)
    toast(message)
    navigate('/login', { state: { from: { pathname: `/shows/${id}` } } })
  }

  const scrollToSection = (section: 'info' | 'companion' | 'review') => {
    const target =
      section === 'info'
        ? infoSectionRef.current
        : section === 'companion'
        ? companionSectionRef.current
        : reviewSectionRef.current

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (showReviewForm) {
      reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showReviewForm])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="aspect-[3/4] rounded-3xl bg-warm-100" />
          <div className="space-y-4">
            <div className="h-6 w-24 rounded bg-warm-100" />
            <div className="h-12 w-2/3 rounded bg-warm-100" />
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 rounded-2xl bg-warm-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-800">공연 정보를 불러오지 못했어요.</p>
        <p className="mt-2 text-sm text-gray-500">잠시 후 다시 시도해 주세요.</p>
        <button onClick={() => refetch()} className="btn-primary mt-6 px-6">
          다시 시도
        </button>
      </div>
    )
  }

  if (!show) return null

  const castList =
    show.castList ||
    (show.castInfo
      ? show.castInfo
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [])

  const statusBadgeClass = STATUS_BADGE_CLASS[show.status] || 'badge-ended'
  const genreBadgeClass = GENRE_BADGE_CLASS[show.genre] || 'badge-play'
  const companionCount = companionSummary?.totalElements ?? 0

  const handleDiary = () => {
    if (!isAuthenticated) {
      requireLogin('관극 기록은 로그인 후에 남길 수 있어요.')
      return
    }
    setShowDiaryForm(true)
  }

  const handleReview = () => {
    if (!isAuthenticated) {
      requireLogin('후기 작성은 로그인 후에 이용할 수 있어요.')
      return
    }
    setShowReviewForm(true)
  }

  return (
    <div className="bg-white pb-28 sm:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-card-md">
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt={show.title} className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 bg-warm-100 text-gray-400">
                    <ImageOff size={24} />
                    <p className="text-sm font-medium">포스터 준비 중</p>
                  </div>
                )}
              </div>

              <div className="paper-panel p-5">
                <p className="journal-kicker">바로 할 수 있는 일</p>
                <div className="mt-4 grid gap-2">
                  <button onClick={handleDiary} className="btn-primary justify-between px-4 py-3">
                    <span>관극 기록</span>
                    <BookOpen size={16} />
                  </button>
                  <button
                    onClick={() => scrollToSection('companion')}
                    className="btn-secondary justify-between px-4 py-3"
                  >
                    <span>동행 보기</span>
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={handleReview} className="btn-secondary justify-between px-4 py-3">
                    <span>후기 남기기</span>
                    <Star size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        requireLogin('찜 기능은 로그인 후에 이용할 수 있어요.')
                        return
                      }
                      toggleFav.mutate()
                    }}
                    disabled={isAuthenticated && toggleFav.isPending}
                    className={`inline-flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      favStatus?.isFavorited
                        ? 'border-brand/15 bg-brand-50 text-brand'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-warm-50'
                    }`}
                  >
                    <span>{favStatus?.isFavorited ? '찜 해제' : '찜하기'}</span>
                    <Heart size={16} className={favStatus?.isFavorited ? 'fill-brand' : ''} />
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  <StatChip label="동행" value={`${companionCount}개`} />
                  <StatChip label="리뷰" value={`${show.reviewCount ?? 0}개`} />
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <section className="paper-panel overflow-hidden p-5 sm:p-6">
              <div className="lg:hidden">
                <div className="flex gap-4">
                  {show.posterUrl ? (
                    <img
                      src={show.posterUrl}
                      alt={show.title}
                      className="h-40 w-28 rounded-2xl object-cover shadow-card-md"
                    />
                  ) : (
                    <div className="flex h-40 w-28 items-center justify-center rounded-2xl bg-warm-100 text-gray-400">
                      <ImageOff size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className={statusBadgeClass}>{show.statusDisplayName}</span>
                      <span className={genreBadgeClass}>{show.genreDisplayName}</span>
                    </div>
                    <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-gray-900">
                      {show.title}
                    </h1>
                    <div className="mt-3 flex items-center gap-2">
                      {show.averageScore !== undefined && show.averageScore !== null ? (
                        <>
                          <StarRating value={Math.round(show.averageScore)} readonly size="sm" />
                          <span className="text-base font-semibold text-gray-900">
                            {show.averageScore.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-400">({show.reviewCount ?? 0})</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">아직 후기 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="flex flex-wrap gap-2">
                  <span className={statusBadgeClass}>{show.statusDisplayName}</span>
                  <span className={genreBadgeClass}>{show.genreDisplayName}</span>
                </div>
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] text-gray-900 xl:text-5xl">
                  {show.title}
                </h1>
                <div className="mt-4 flex items-center gap-2">
                  {show.averageScore !== undefined && show.averageScore !== null ? (
                    <>
                      <StarRating value={Math.round(show.averageScore)} readonly size="sm" />
                      <span className="text-lg font-semibold text-gray-900">{show.averageScore.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({show.reviewCount ?? 0}개 후기)</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">아직 후기 없음</span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatChip label="관극 기록" value="다이어리 남기기" tone="highlight" />
                <StatChip label="동행" value={`${companionCount}개 모집`} />
                <StatChip label="리뷰" value={`${show.reviewCount ?? 0}개`} />
                <StatChip label="상태" value={show.statusDisplayName} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DetailCard icon={<MapPin size={15} />} label="공연장" value={show.theaterName || '정보 없음'} />
                <DetailCard
                  icon={<CalendarDays size={15} />}
                  label="공연 기간"
                  value={show.startDate ? `${show.startDate} ~ ${show.endDate || '미정'}` : '정보 없음'}
                />
                <DetailCard icon={<Clock3 size={15} />} label="러닝타임" value={show.runtime || '정보 없음'} />
                <PriceCard priceInfo={show.priceInfo} />
              </div>
            </section>

            <section className="ticket-panel mt-4 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="journal-kicker">빠른 이동</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                    필요한 섹션으로 바로 이동하세요
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button onClick={handleDiary} className="btn-primary justify-between px-4 py-3">
                    <span>다이어리 작성</span>
                    <BookOpen size={16} />
                  </button>
                  <button
                    onClick={() => scrollToSection('companion')}
                    className="btn-secondary justify-between px-4 py-3"
                  >
                    <span>동행 보기</span>
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => scrollToSection('review')}
                    className="btn-secondary justify-between px-4 py-3"
                  >
                    <span>후기 보기</span>
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
            </section>

            <section ref={infoSectionRef} className="paper-panel mt-6 p-6 sm:p-7 scroll-mt-24">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="journal-kicker">공연 정보</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">상세 정보와 캐스팅</h2>
                </div>
                <button
                  onClick={() => scrollToSection('review')}
                  className="hidden items-center gap-2 text-sm font-semibold text-gray-400 transition-colors hover:text-brand sm:inline-flex"
                >
                  후기로 이동
                  <ChevronRight size={16} />
                </button>
              </div>

              {castList.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users size={15} className="text-gray-400" />
                    출연진
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {castList.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center rounded-full border border-gray-100 bg-warm-50 px-3 py-1.5 text-sm text-gray-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {show.introImages && show.introImages.length > 0 && (
                <div className="mt-6 space-y-3">
                  {show.introImages.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${show.title} 소개 이미지 ${index + 1}`}
                      className="w-full rounded-2xl border border-gray-100"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              <div className="mt-8">
                <CastingBoard showId={Number(id)} />
              </div>
            </section>

            <section ref={companionSectionRef} className="mt-6 scroll-mt-24">
              <CompanionList showId={Number(id)} />
            </section>

            <section ref={reviewSectionRef} className="paper-panel mt-6 p-6 sm:p-7 scroll-mt-24">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="journal-kicker">리뷰</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">관람 후기</h2>
                </div>
                <button onClick={handleReview} className="btn-secondary px-4 py-2.5">
                  <Star size={16} />
                  후기 남기기
                </button>
              </div>
              <ReviewList
                showId={Number(id)}
                showReviewForm={showReviewForm}
                onCloseForm={() => setShowReviewForm(false)}
              />
            </section>

            {show.status === 'ONGOING' && (
              <section className="paper-panel mt-6 overflow-hidden p-0">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5">
                    <div>
                      <p className="journal-kicker">라이브 채팅</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                        오늘 관람자 대화
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        필요할 때만 열어볼 수 있는 보조 기능으로 두었습니다.
                      </p>
                    </div>
                    <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
                      펼치기
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 px-4 py-4 sm:px-6">
                    <ShowLiveChat showId={Number(id)} />
                  </div>
                </details>
              </section>
            )}
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[4.5rem] z-40 px-4 sm:hidden">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-card-md backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleDiary} className="btn-primary px-3 py-3 text-sm">
              기록
            </button>
            <button
              onClick={() => scrollToSection('companion')}
              className="btn-secondary px-3 py-3 text-sm"
            >
              동행
            </button>
            <button onClick={() => scrollToSection('review')} className="btn-secondary px-3 py-3 text-sm">
              후기
            </button>
          </div>
        </div>
      </div>

      {showDiaryForm && (
        <DiaryFormModal
          initialShowId={show.id}
          initialShowTitle={show.title}
          onClose={() => setShowDiaryForm(false)}
          onSaved={() => setShowDiaryForm(false)}
        />
      )}
    </div>
  )
}
