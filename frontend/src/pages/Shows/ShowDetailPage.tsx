import { useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  Heart,
  ImageOff,
  MapPin,
  ScanLine,
  Star,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import { favoritesApi } from '../../api/favorites'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiarySavedSheet from '../../components/diary/DiarySavedSheet'
import TicketDraftUploadModal from '../../components/diary/TicketDraftUploadModal'
import CompanionList from '../../components/companion/CompanionList'
import ReviewList from '../../components/review/ReviewList'
import CastingBoard from '../../components/casting/CastingBoard'
import ShowLiveChat from '../../components/show/ShowLiveChat'
import StarRating from '../../components/common/StarRating'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry, DiarySnippet, Show, TicketDraftResponse } from '../../types'

const STATUS_BADGE_CLASS: Record<string, string> = {
  ONGOING: 'badge-ongoing',
  UPCOMING: 'badge-upcoming',
  ENDED: 'badge-ended',
}

const GENRE_BADGE_CLASS: Record<string, string> = {
  MUSICAL: 'badge-musical',
  PLAY: 'badge-play',
}

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const companionRef = useRef<HTMLElement | null>(null)
  const reviewRef = useRef<HTMLElement | null>(null)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [showTicketDraft, setShowTicketDraft] = useState(false)
  const [diaryMode, setDiaryMode] = useState<'quick' | 'full'>('quick')
  const [ticketDraft, setTicketDraft] = useState<TicketDraftResponse | undefined>()
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<DiaryEntry | undefined>()
  const [savedDiaryEntry, setSavedDiaryEntry] = useState<DiaryEntry | undefined>()
  const [showSavedSheet, setShowSavedSheet] = useState(false)
  const [showLiveSection, setShowLiveSection] = useState(true)

  const { data: show, isLoading, isError, refetch } = useQuery({
    queryKey: ['show', id],
    queryFn: () => showsApi.getById(showId),
    enabled: Number.isFinite(showId),
  })

  const { data: favStatus } = useQuery({
    queryKey: ['favorite-status', id],
    queryFn: () => favoritesApi.getStatus(showId),
    enabled: Number.isFinite(showId) && isAuthenticated,
  })

  const { data: diarySnippets, isLoading: isDiarySnippetsLoading } = useQuery({
    queryKey: ['show-diary-snippets', showId],
    queryFn: () => diaryApi.getPublicSnippets(showId, 3),
    enabled: Number.isFinite(showId),
  })

  const toggleFav = useMutation({
    mutationFn: () => favoritesApi.toggle(showId),
    onSuccess: (data) => {
      queryClient.setQueryData(['favorite-status', id], data)
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success(data.isFavorited ? '찜 목록에 추가했습니다.' : '찜 목록에서 제거했습니다.')
    },
  })

  const requireLogin = (message: string) => {
    sessionStorage.setItem('postLoginRedirect', `/shows/${id}`)
    toast(message)
    navigate('/login', { state: { from: { pathname: `/shows/${id}` } } })
  }

  const scrollToSection = (element: HTMLElement | null) => {
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openDiaryModal = (mode: 'quick' | 'full', entry?: DiaryEntry) => {
    if (!isAuthenticated) {
      requireLogin('관극 기록은 로그인 후 이용할 수 있습니다.')
      return
    }

    setTicketDraft(undefined)
    setEditingDiaryEntry(entry)
    setDiaryMode(mode)
    setShowDiaryForm(true)
  }

  const openTicketDraftModal = () => {
    if (!isAuthenticated) {
      requireLogin('티켓으로 시작하려면 로그인해 주세요.')
      return
    }
    setShowTicketDraft(true)
  }

  const openReviewForm = () => {
    if (!isAuthenticated) {
      requireLogin('후기를 남기려면 로그인해 주세요.')
      return
    }

    setShowReviewForm(true)
    window.setTimeout(() => scrollToSection(reviewRef.current), 0)
  }

  const handleDiarySaved = (savedEntry: DiaryEntry) => {
    setShowDiaryForm(false)

    if (diaryMode === 'quick' && !editingDiaryEntry) {
      setSavedDiaryEntry(savedEntry)
      setShowSavedSheet(true)
      return
    }

    setEditingDiaryEntry(undefined)
    setSavedDiaryEntry(undefined)
    setTicketDraft(undefined)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="aspect-[3/4] rounded-2xl bg-warm-100" />
          <div className="space-y-4">
            <div className="h-6 w-1/4 rounded bg-warm-100" />
            <div className="h-10 w-2/3 rounded bg-warm-100" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded-xl bg-warm-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="mb-2 text-lg font-semibold text-gray-800">공연 정보를 불러오지 못했습니다.</p>
        <p className="mb-6 text-sm text-gray-500">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
        <button onClick={() => refetch()} className="btn-primary px-6">
          다시 시도
        </button>
      </div>
    )
  }

  if (!show) return null

  const castList =
    show.castList ||
    (show.castInfo ? show.castInfo.split(',').map((name) => name.trim()).filter(Boolean) : [])

  const statusBadgeClass = STATUS_BADGE_CLASS[show.status] || 'badge-ended'
  const genreBadgeClass = GENRE_BADGE_CLASS[show.genre] || 'badge-play'
  const isOngoing = show.status === 'ONGOING'

  return (
    <div className="bg-white pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-2xl shadow-card-md">
              {show.posterUrl ? (
                <img src={show.posterUrl} alt={show.title} className="aspect-[3/4] w-full object-cover" />
              ) : (
                <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-warm-100 text-gray-400">
                  <ImageOff size={24} />
                  <p className="text-xs font-medium">포스터 준비 중</p>
                </div>
              )}
            </div>

            <div className="card hidden p-4 lg:block">
              <p className="mb-3 text-xs font-semibold tracking-wide text-gray-400">빠른 이동</p>
              <div className="grid gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      requireLogin('찜 기능은 로그인 후 이용할 수 있습니다.')
                      return
                    }
                    toggleFav.mutate()
                  }}
                  disabled={isAuthenticated && toggleFav.isPending}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    favStatus?.isFavorited
                      ? 'border-brand-200 bg-brand-50 text-brand hover:bg-brand-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-warm-50'
                  }`}
                >
                  <Heart size={15} className={favStatus?.isFavorited ? 'fill-brand' : ''} />
                  {favStatus?.isFavorited ? '찜 해제' : '찜하기'}
                  {favStatus?.favoriteCount ? (
                    <span className="text-xs text-gray-400">({favStatus.favoriteCount})</span>
                  ) : null}
                </button>

                <button onClick={() => openDiaryModal('quick')} className="btn-primary px-4 py-2.5 text-sm">
                  <BookOpen size={15} />
                  기록하기
                </button>

                <button onClick={openTicketDraftModal} className="btn-secondary px-4 py-2.5 text-sm">
                  <ScanLine size={15} />
                  티켓으로 시작
                </button>

                <button
                  onClick={() => scrollToSection(companionRef.current)}
                  className="btn-secondary px-4 py-2.5 text-sm"
                >
                  <Users size={15} />
                  동행 보기
                </button>

                <button onClick={openReviewForm} className="btn-secondary px-4 py-2.5 text-sm">
                  <Star size={15} />
                  후기 남기기
                </button>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="card p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={statusBadgeClass}>{show.statusDisplayName}</span>
                <span className={genreBadgeClass}>{show.genreDisplayName}</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{show.title}</h1>

              <div className="mt-4 flex items-center gap-2">
                {show.averageScore !== undefined && show.averageScore !== null ? (
                  <>
                    <StarRating value={Math.round(show.averageScore)} readonly size="sm" />
                    <span className="text-lg font-semibold text-gray-900">{show.averageScore.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({show.reviewCount ?? 0}개 후기)</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">아직 등록된 평점이 없습니다.</span>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={() => openDiaryModal('quick')} className="btn-primary justify-center px-4 py-3">
                  기록하기
                </button>
                <button onClick={openTicketDraftModal} className="btn-secondary justify-center px-4 py-3">
                  티켓으로 시작
                </button>
                <button
                  onClick={() => scrollToSection(companionRef.current)}
                  className="btn-secondary justify-center px-4 py-3"
                >
                  동행 보기
                </button>
                <button
                  onClick={() => scrollToSection(reviewRef.current)}
                  className="btn-secondary justify-center px-4 py-3"
                >
                  후기 보기
                </button>
              </div>
            </div>

            <div className="card p-6 md:p-8">
              <h2 className="text-lg font-semibold text-gray-900">공연 정보</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoCard icon={<MapPin size={15} />} label="공연장" value={show.theaterName || '정보 없음'} />
                <InfoCard
                  icon={<CalendarDays size={15} />}
                  label="공연 기간"
                  value={show.startDate ? `${show.startDate} ~ ${show.endDate || '미정'}` : '정보 없음'}
                />
                <InfoCard icon={<Clock3 size={15} />} label="러닝타임" value={show.runtime || '정보 없음'} />
                <PriceInfoCard priceInfo={show.priceInfo} />
              </div>

              {castList.length > 0 ? (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
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
              ) : null}

              {show.introImages?.length ? (
                <div className="mt-6 space-y-3">
                  {show.introImages.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${show.title} 소개 이미지 ${index + 1}`}
                      className="w-full rounded-xl border border-gray-100"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-8">
                <CastingBoard showId={showId} />
              </div>
            </div>

            <PublicDiarySection
              show={show}
              snippets={diarySnippets?.items ?? []}
              totalCount={diarySnippets?.totalCount ?? 0}
              seatRecordCount={diarySnippets?.seatRecordCount ?? 0}
              isLoading={isDiarySnippetsLoading}
              onWriteDiary={() => openDiaryModal('quick')}
              onStartWithTicket={openTicketDraftModal}
              onRequireLogin={() => requireLogin('관극 기록은 로그인 후 이용할 수 있습니다.')}
              isAuthenticated={isAuthenticated}
            />

            <section ref={companionRef}>
              <CompanionList showId={showId} />
            </section>

            <section ref={reviewRef}>
              <ReviewList showId={showId} showReviewForm={showReviewForm} onCloseForm={() => setShowReviewForm(false)} />
            </section>

            {isOngoing ? (
              <section className="card p-6 md:p-8">
                <button
                  onClick={() => setShowLiveSection((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">오늘 관람 이야기</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      공연을 보고 있는 관람객끼리 짧게 이야기를 나눌 수 있습니다.
                    </p>
                  </div>
                  {showLiveSection ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {showLiveSection ? (
                  <div className="mt-5">
                    <ShowLiveChat showId={showId} />
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2">
          <button onClick={() => openDiaryModal('quick')} className="btn-primary justify-center px-3 py-2.5 text-sm">
            기록
          </button>
          <button
            onClick={() => scrollToSection(companionRef.current)}
            className="btn-secondary justify-center px-3 py-2.5 text-sm"
          >
            동행
          </button>
          <button
            onClick={() => scrollToSection(reviewRef.current)}
            className="btn-secondary justify-center px-3 py-2.5 text-sm"
          >
            후기
          </button>
        </div>
      </div>

      {showDiaryForm ? (
        <DiaryFormModal
          entry={editingDiaryEntry}
          initialShowId={show.id}
          initialShowTitle={show.title}
          initialDraft={ticketDraft}
          mode={diaryMode}
          onClose={() => {
            setShowDiaryForm(false)
            setEditingDiaryEntry(undefined)
            setTicketDraft(undefined)
          }}
          onSaved={handleDiarySaved}
        />
      ) : null}

      {showTicketDraft ? (
        <TicketDraftUploadModal
          onClose={() => setShowTicketDraft(false)}
          onDraftReady={(draft) => {
            setShowTicketDraft(false)
            setTicketDraft(draft)
            setEditingDiaryEntry(undefined)
            setDiaryMode('quick')
            setShowDiaryForm(true)
          }}
        />
      ) : null}

      {showSavedSheet && savedDiaryEntry ? (
        <DiarySavedSheet
          entry={savedDiaryEntry}
          onClose={() => {
            setShowSavedSheet(false)
            setSavedDiaryEntry(undefined)
            setTicketDraft(undefined)
          }}
          onExpand={() => {
            setShowSavedSheet(false)
            setTicketDraft(undefined)
            setEditingDiaryEntry(savedDiaryEntry)
            setDiaryMode('full')
            setShowDiaryForm(true)
          }}
          onWriteReview={() => {
            setShowSavedSheet(false)
            setSavedDiaryEntry(undefined)
            openReviewForm()
          }}
        />
      ) : null}
    </div>
  )
}

function PublicDiarySection({
  show,
  snippets,
  totalCount,
  seatRecordCount,
  isLoading,
  onWriteDiary,
  onStartWithTicket,
  onRequireLogin,
  isAuthenticated,
}: {
  show: Show
  snippets: DiarySnippet[]
  totalCount: number
  seatRecordCount: number
  isLoading: boolean
  onWriteDiary: () => void
  onStartWithTicket: () => void
  onRequireLogin: () => void
  isAuthenticated: boolean
}) {
  const seatSnippets = snippets.filter((snippet) => snippet.seatInfo || snippet.viewRating)

  return (
    <section className="card p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">최근 공개 기록</h2>
          <p className="mt-1 text-sm text-gray-500">
            공개 기록 {totalCount}개 · 좌석 기록 {seatRecordCount}개
            {show.averageScore ? ` · 현재 평균 평점 ${show.averageScore.toFixed(1)}` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={isAuthenticated ? onStartWithTicket : onRequireLogin}
            className="btn-secondary w-full justify-center px-4 py-2.5 text-sm sm:w-auto"
          >
            티켓으로 시작
          </button>
          <button
            onClick={isAuthenticated ? onWriteDiary : onRequireLogin}
            className="btn-secondary w-full justify-center px-4 py-2.5 text-sm sm:w-auto"
          >
            나도 기록하기
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-gray-100 p-4">
              <div className="h-32 rounded-xl bg-warm-100" />
              <div className="mt-4 h-4 w-1/2 rounded bg-warm-100" />
              <div className="mt-2 h-3 rounded bg-warm-100" />
              <div className="mt-2 h-3 w-5/6 rounded bg-warm-100" />
            </div>
          ))}
        </div>
      ) : snippets.length > 0 ? (
        <div className="mt-5 space-y-5">
          {seatSnippets.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">좌석과 시야 기록</h3>
                <span className="text-xs text-gray-400">최근 {seatSnippets.length}개 표시</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {seatSnippets.map((snippet) => (
                  <article key={snippet.diaryId} className="rounded-2xl border border-gray-100 bg-warm-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{snippet.userNickname}</p>
                      <span className="text-xs text-gray-400">{snippet.watchedDate}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {snippet.seatInfo ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-gray-700">{snippet.seatInfo}</span>
                      ) : null}
                      {snippet.viewRating ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-gray-700">시야 {snippet.viewRating}점</span>
                      ) : null}
                      {snippet.entrySource === 'TICKET_CAPTURE' ? (
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand">티켓 시작</span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {snippet.comment || '짧은 감상은 아직 남기지 않았습니다.'}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">공개 기록 조각</h3>
              <span className="text-xs text-gray-400">최근 {snippets.length}개 표시</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {snippets.map((snippet) => (
                <article key={snippet.diaryId} className="rounded-2xl border border-gray-100 bg-white p-4">
                  {snippet.representativeImageUrl ? (
                    <img
                      src={snippet.representativeImageUrl}
                      alt={`${snippet.userNickname}의 기록`}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-xl bg-warm-100 text-gray-400">
                      <BookOpen size={20} />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{snippet.userNickname}</p>
                    <span className="text-xs text-gray-400">{snippet.watchedDate}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-sm text-gray-700">
                    <Star size={14} className="fill-gold text-gold" />
                    <span>{snippet.rating.toFixed(1)}</span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {snippet.comment || '짧은 감상은 아직 남기지 않았습니다.'}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          아직 공개된 기록이 없습니다. 이 공연을 보고 남긴 첫 기록을 만들어 보세요.
        </div>
      )}
    </section>
  )
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-warm-50 px-4 py-3">
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function PriceInfoCard({ priceInfo }: { priceInfo?: string }) {
  const lines = priceInfo ? priceInfo.split(',').map((item) => item.trim()).filter(Boolean) : []

  return (
    <div className="rounded-xl border border-gray-100 bg-warm-50 px-4 py-3">
      <p className="mb-1 text-xs font-medium text-gray-400">가격 정보</p>
      {lines.length > 0 ? (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-gray-400">
            <DollarSign size={15} />
          </span>
          <div className="space-y-0.5">
            {lines.map((line) => (
              <p key={line} className="text-sm text-gray-800">
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            <DollarSign size={15} />
          </span>
          <p className="text-sm text-gray-800">정보 없음</p>
        </div>
      )}
    </div>
  )
}
