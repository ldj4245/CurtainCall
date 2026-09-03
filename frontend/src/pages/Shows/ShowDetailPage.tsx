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

type DetailTab = 'info' | 'reviews' | 'companion'

const TAB_ITEMS: { key: DetailTab; label: string; mobileLabel: string }[] = [
  { key: 'info', label: '공연 정보 & 캐스팅', mobileLabel: '정보 & 캐스팅' },
  { key: 'reviews', label: '관람 후기 & 시야', mobileLabel: '후기 & 시야' },
  { key: 'companion', label: '동행 & 톡', mobileLabel: '동행 & 톡' },
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
    <div className="min-h-screen bg-surface-base pb-36">
      <div className="px-4 py-4 sm:px-5">
        <p className="text-[10px] text-ink-lightest mb-2">
          홈&nbsp; › &nbsp;공연 찾기&nbsp; › &nbsp;<span className="text-ink-light">{show.title}</span>
        </p>

        {/* 상단 공연 기본 요약 (정비율 3:4 포스터 + 깔끔한 텍스트 정렬) */}
        <section className="mt-2 flex gap-3.5 items-start">
          <div className="w-[110px] aspect-[3/4] shrink-0 overflow-hidden rounded bg-surface-muted border border-line-lightest shadow-sm">
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

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[10px] font-bold">
                {show.genreDisplayName}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isOngoing ? 'bg-ink-darkest text-white' : 'bg-gray-100 text-ink-muted'}`}>
                {isOngoing ? '공연중' : show.statusDisplayName}
              </span>
            </div>

            <h1 className="mt-1 text-[16px] font-bold text-ink-darkest leading-snug line-clamp-2">
              {show.title}
            </h1>

            <div className="mt-1.5 space-y-0.5 text-[11px] text-ink-muted">
              <p className="font-medium text-ink-darker truncate">
                {show.theaterName || '공연장 미정'}
              </p>
              <p className="text-[10px] text-ink-light truncate">
                {show.startDate ? `${show.startDate} ~ ${show.endDate || '미정'}` : '일정 미정'}
              </p>
              {show.runtime && (
                <p className="text-[10px] text-ink-lightest">
                  러닝타임 {show.runtime} {show.ageLimit ? `· ${show.ageLimit}` : ''}
                </p>
              )}
            </div>

            {/* 평점 & 찜 버튼 */}
            <div className="mt-2.5 flex items-center justify-between border-t border-line-lightest pt-2">
              <div className="flex items-center gap-1 text-[12px]">
                {show.averageScore != null && show.averageScore > 0 ? (
                  <>
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-ink-darkest">{show.averageScore.toFixed(1)}</span>
                    <span className="text-[10px] text-ink-lightest">({show.reviewCount ?? 0})</span>
                  </>
                ) : (
                  <span className="text-[10px] text-ink-lightest">별점 등록 전</span>
                )}
              </div>

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
                className={`h-6 px-2 rounded border text-[10px] font-medium flex items-center gap-1 transition-colors ${
                  favStatus?.isFavorited
                    ? 'border-brand text-brand bg-brand/5'
                    : 'border-line-base text-ink-muted hover:border-ink-darkest hover:text-ink-darkest'
                }`}
              >
                <Heart size={10} className={favStatus?.isFavorited ? 'fill-brand text-brand' : ''} />
                <span>{favStatus?.isFavorited ? '찜완료' : '찜'}</span>
                {Boolean(favStatus?.favoriteCount) && (
                  <span className="opacity-80">({favStatus?.favoriteCount})</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 예매처 바로가기 링크 (존재 시 배너형으로 노출) */}
        {bookingLinks[0] && (
          <a
            href={bookingLinks[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full h-8 rounded bg-ink-darkest text-white text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-brand transition-colors"
          >
            <span>{show.title} 공식 예매처 바로가기</span>
            <span className="text-[9px] opacity-70">↗</span>
          </a>
        )}

        {/* 탭 네비게이션: 3등분 그리드, 모바일 간결 레이블 대응 */}
        <nav className="mt-5 grid grid-cols-3 border-b border-line-base text-[12px] text-ink-lighter text-center">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-brand font-bold text-ink-darkest'
                  : 'hover:text-ink-darker text-ink-muted'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </nav>

        <div className="mt-4 space-y-5 pb-10">
          {/* 1. 공연 정보 & 캐스팅 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <ShowInfoTab show={show} />
              <div className="border-t border-line-lightest pt-5">
                <ShowCastingTab showId={showId} fallbackCastInfo={show.castInfo} />
              </div>
            </div>
          )}

          {/* 2. 관람 후기 & 시야 */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <ShowReviewsTab
                show={show}
                showId={showId}
                diarySnippets={diarySnippets?.items ?? []}
                onWriteDiary={() => openDiaryModal('quick')}
                showReviewForm={showReviewForm}
                onOpenReviewForm={openReviewForm}
                onCloseReviewForm={() => setShowReviewForm(false)}
              />
              <div className="border-t border-line-lightest pt-5">
                <ShowSeatViewTab
                  show={show}
                  diarySnippets={diarySnippets?.items ?? []}
                  onAddSeatReview={() => openDiaryModal('full')}
                />
              </div>
            </div>
          )}

          {/* 3. 동행 & 톡 */}
          {activeTab === 'companion' && (
            <ShowCompanionLiveTab showId={showId} isOngoing={isOngoing} />
          )}
        </div>
      </div>

      {/* 하단 플로팅 액션바 (높이 38px 터치 최적화, safe-area 대응) */}
      <div className="fixed bottom-[calc(54px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-full max-w-[460px] z-40 border-t border-line-base bg-white/95 backdrop-blur-md px-4 py-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openDiaryModal('quick')}
            className="h-9 bg-brand text-[12px] font-bold text-white rounded flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
          >
            관극 기록하기
          </button>
          <button
            onClick={openReviewForm}
            className="h-9 border border-line-base bg-surface-base text-[12px] font-semibold text-ink-darkest rounded flex items-center justify-center gap-1.5 hover:border-line-dark transition-colors"
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
          initialCastMemo={show.castInfo}
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
