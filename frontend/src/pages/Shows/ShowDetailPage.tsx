import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Heart, ImageOff, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import { favoritesApi } from '../../api/favorites'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiarySavedSheet from '../../components/diary/DiarySavedSheet'
import ShowCastingTab from '../../components/show/ShowCastingTab'
import ShowInfoTab from '../../components/show/ShowInfoTab'
import ShowSeatViewTab from '../../components/show/ShowSeatViewTab'
import ShowReviewsTab from '../../components/show/ShowReviewsTab'
import ShowCompanionLiveTab from '../../components/show/ShowCompanionLiveTab'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry } from '../../types'
import { getBookingLinks } from '../../utils/showUtils'

type DetailTab = 'info' | 'casting' | 'seatview' | 'reviews' | 'companion'

const TAB_ITEMS: { key: DetailTab; label: string }[] = [
  { key: 'info', label: '공연정보' },
  { key: 'casting', label: '캐스팅' },
  { key: 'seatview', label: '좌석시야' },
  { key: 'reviews', label: '후기' },
  { key: 'companion', label: '동행' },
]

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [activeTab, setActiveTab] = useState<DetailTab>('info')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [diaryMode, setDiaryMode] = useState<'quick' | 'full'>('quick')
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<DiaryEntry | undefined>()
  const [savedDiaryEntry, setSavedDiaryEntry] = useState<DiaryEntry | undefined>()
  const [showSavedSheet, setShowSavedSheet] = useState(false)

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

  const { data: diarySnippets } = useQuery({
    queryKey: ['show-diary-snippets', showId],
    queryFn: () => diaryApi.getPublicSnippets(showId, 10),
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

  const openDiaryModal = (mode: 'quick' | 'full', entry?: DiaryEntry) => {
    if (!isAuthenticated) {
      requireLogin('관극 기록은 로그인 후 이용할 수 있습니다.')
      return
    }
    setEditingDiaryEntry(entry)
    setDiaryMode(mode)
    setShowDiaryForm(true)
  }

  const openReviewForm = () => {
    if (!isAuthenticated) {
      requireLogin('후기를 남기려면 로그인해 주세요.')
      return
    }
    setActiveTab('reviews')
    setShowReviewForm(true)
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
  }

  if (isNaN(showId) || showId <= 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-[15px] font-semibold text-gray-800">유효하지 않은 공연 ID입니다.</p>
        <button onClick={() => navigate('/shows')} className="mt-4 text-[13px] font-semibold text-brand hover:underline">
          공연 목록으로
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-8 animate-pulse space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <div className="aspect-[3/4] rounded bg-gray-100" />
          <div className="space-y-3">
            <div className="h-5 w-20 rounded bg-gray-100" />
            <div className="h-7 w-2/3 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-1/3 rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-10 bg-gray-100 rounded" />
        <div className="h-48 bg-gray-50 rounded" />
      </div>
    )
  }

  if (isError || !show) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-[15px] font-semibold text-gray-800">공연 정보를 불러오지 못했습니다.</p>
        <p className="text-[13px] text-gray-500 mt-1">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
        <button onClick={() => refetch()} className="mt-4 text-[13px] font-semibold text-brand hover:underline">
          다시 시도
        </button>
      </div>
    )
  }

  const isOngoing = show.status === 'ONGOING'
  const bookingLinks = getBookingLinks(show.title)

  return (
    <div className="min-h-screen bg-surface-base pb-28">
      <div className="px-4 py-4 sm:px-5">
        <p className="text-[10px] text-ink-lightest mb-2">
          홈&nbsp; › &nbsp;공연 찾기&nbsp; › &nbsp;<span className="text-ink-light">{show.title}</span>
        </p>

        <section className="mt-2 grid grid-cols-[105px_1fr] gap-3.5">
          <div className="overflow-hidden bg-surface-background h-[150px] border border-line-lightest">
            {show.posterUrl ? (
              <img
                src={show.posterUrl}
                alt={show.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-lightest">
                <ImageOff size={20} />
                <p className="text-[10px]">포스터 없음</p>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-brand">
              {show.genreDisplayName} · {isOngoing ? '공연중' : show.statusDisplayName}
            </span>
            <h1 className="mt-0.5 text-[16px] font-semibold tracking-[-0.04em] text-ink-darker line-clamp-2">
              {show.title}
            </h1>
            <p className="mt-1 text-[11px] text-ink-light">
              {show.startDate ? `${show.startDate} ~ ${show.endDate || '미정'}` : '일정 미정'}
            </p>

            <dl className="mt-4 border-t border-line-light text-[11px]">
              <div className="grid grid-cols-[75px_1fr] border-b border-line-lightest py-2">
                <dt className="text-ink-lightest">공연장</dt>
                <dd className="m-0 text-ink-muted">{show.theaterName || '-'}</dd>
              </div>
              {show.runtime && (
                <div className="grid grid-cols-[75px_1fr] border-b border-line-lightest py-2">
                  <dt className="text-ink-lightest">관람시간</dt>
                  <dd className="m-0 text-ink-muted">{show.runtime}</dd>
                </div>
              )}
              {show.ageLimit && (
                <div className="grid grid-cols-[75px_1fr] border-b border-line-lightest py-2">
                  <dt className="text-ink-lightest">관람연령</dt>
                  <dd className="m-0 text-ink-muted">{show.ageLimit}</dd>
                </div>
              )}
              {show.priceInfo && (
                <div className="grid grid-cols-[75px_1fr] border-b border-line-lightest py-2">
                  <dt className="text-ink-lightest">가격</dt>
                  <dd className="m-0 text-ink-muted">{show.priceInfo}</dd>
                </div>
              )}
              <div className="grid grid-cols-[75px_1fr] border-b border-line-lightest py-2">
                <dt className="text-ink-lightest">평점</dt>
                <dd className="m-0 flex items-center gap-1 text-ink-muted">
                  {show.averageScore != null && show.averageScore > 0 ? (
                    <>
                      <Star size={11} className="fill-brand text-brand" />
                      <span className="font-semibold">{show.averageScore.toFixed(1)}</span>
                      <span>({show.reviewCount ?? 0})</span>
                    </>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              {bookingLinks[0] ? (
                <a
                  href={bookingLinks[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[34px] items-center justify-center bg-brand px-3.5 text-[11px] font-semibold text-white"
                >
                  예매처 보기
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => openDiaryModal('quick')}
                className="h-[34px] border border-[#d9d9d9] bg-surface-base px-3.5 text-[11px] text-ink-muted"
              >
                관극 기록하기
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    requireLogin('찜 기능은 로그인 후 이용할 수 있습니다.')
                    return
                  }
                  toggleFav.mutate()
                }}
                disabled={isAuthenticated && toggleFav.isPending}
                className="flex h-[34px] items-center justify-center border border-[#d9d9d9] bg-surface-base px-3.5 text-[11px] text-ink-muted"
              >
                <Heart size={12} className={`mr-1 ${favStatus?.isFavorited ? 'fill-brand text-brand' : ''}`} />
                {favStatus?.isFavorited ? '찜함' : '찜하기'} {favStatus?.favoriteCount ? `(${favStatus.favoriteCount})` : ''}
              </button>
            </div>
          </div>
        </section>

        <nav className="mt-8 flex gap-5 border-b border-line-base text-[12px] text-ink-lighter overflow-x-auto scrollbar-none">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-brand font-semibold text-ink-base'
                  : 'hover:text-ink-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-5">
          {activeTab === 'casting' && (
            <ShowCastingTab showId={showId} fallbackCastInfo={show.castInfo} />
          )}
          {activeTab === 'info' && <ShowInfoTab show={show} />}
          {activeTab === 'seatview' && (
            <ShowSeatViewTab
              show={show}
              diarySnippets={diarySnippets?.items ?? []}
              onAddSeatReview={() => openDiaryModal('full')}
            />
          )}
          {activeTab === 'reviews' && (
            <ShowReviewsTab
              show={show}
              showId={showId}
              diarySnippets={diarySnippets?.items ?? []}
              onWriteDiary={() => openDiaryModal('quick')}
              showReviewForm={showReviewForm}
              onOpenReviewForm={openReviewForm}
              onCloseReviewForm={() => setShowReviewForm(false)}
            />
          )}
          {activeTab === 'companion' && (
            <ShowCompanionLiveTab showId={showId} isOngoing={isOngoing} />
          )}
        </div>
      </div>

      <div className="fixed bottom-[54px] left-1/2 -translate-x-1/2 w-full max-w-[460px] z-30 border-t border-line-base bg-surface-base/95 backdrop-blur-md px-4 py-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openDiaryModal('quick')}
            className="h-[34px] bg-brand text-[11px] font-semibold text-white flex items-center justify-center gap-1.5"
          >
            기록 남기기
          </button>
          <button
            onClick={openReviewForm}
            className="h-[34px] border border-line-base bg-surface-base text-[11px] text-ink-muted flex items-center justify-center gap-1.5 hover:border-line-dark transition-colors"
          >
            후기 작성
          </button>
        </div>
      </div>

      {showDiaryForm ? (
        <DiaryFormModal
          entry={editingDiaryEntry}
          initialShowId={show.id}
          initialShowTitle={show.title}
          mode={diaryMode}
          onClose={() => {
            setShowDiaryForm(false)
            setEditingDiaryEntry(undefined)
          }}
          onSaved={handleDiarySaved}
        />
      ) : null}

      {showSavedSheet && savedDiaryEntry ? (
        <DiarySavedSheet
          entry={savedDiaryEntry}
          onClose={() => {
            setShowSavedSheet(false)
            setSavedDiaryEntry(undefined)
          }}
          onExpand={() => {
            setShowSavedSheet(false)
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
