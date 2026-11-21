import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Heart, Star, Share2, Plus, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import { favoritesApi } from '../../api/favorites'
import { showsApi } from '../../api/shows'
import PlanForm from '../../components/plan/PlanForm'
import { track } from '../../utils/analytics'
import Poster from '../../components/common/Poster'
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
  { key: 'info', label: '공연 정보', mobileLabel: '정보 & 캐스팅' },
  { key: 'reviews', label: '관람 후기', mobileLabel: '후기 & 시야' },
  { key: 'companion', label: '동행', mobileLabel: '동행 & 톡' },
]

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [params, setParams] = useSearchParams()
  const activeTab: DetailTab = params.get('tab') === 'reviews' ? 'reviews' : params.get('tab') === 'companion' ? 'companion' : 'info'
  const setActiveTab = (tab: DetailTab) => {
    const next = new URLSearchParams(params)
    if (tab === 'info') next.delete('tab')
    else next.set('tab', tab)
    setParams(next, { replace: true })
  }
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [diaryMode, setDiaryMode] = useState<'quick' | 'full'>('quick')
  const [editingDiaryEntry, setEditingDiaryEntry] = useState<DiaryEntry | undefined>()
  const [savedDiaryEntry, setSavedDiaryEntry] = useState<DiaryEntry | undefined>()
  const [showSavedSheet, setShowSavedSheet] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  useEffect(() => { if (showId > 0) track("show_view", showId) }, [showId])

  const { data: show, isLoading, isError, refetch } = useQuery({
    queryKey: ['show', showId],
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
    openDiaryModal('quick')
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

  const planOpen = isAuthenticated && (showPlan || params.get("plan") === "1")
  const closePlan = () => { setShowPlan(false); const next = new URLSearchParams(params); next.delete("plan"); setParams(next, { replace: true }) }
  const handleShare = async () => {
    if (!show) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: show.title,
          text: `${show.title} - 커튼콜(CurtainCall)에서 확인하세요!`,
          url: window.location.href,
        })
      } catch {
        // 취소
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('공연 링크가 복사되었습니다.')
    }
  }

  return (
    <div className="page-width show-detail-page">
      <section className="detail-overview">
        <Poster src={show.posterUrl} title={show.title} className="detail-poster aspect-[3/4]" />
        <div className="detail-summary">
          <p className="eyebrow">{show.genreDisplayName || '공연'}<span className="!tracking-normal">{show.statusDisplayName}</span></p>
          <h1>{show.title}</h1>
          <p className="detail-theater">{show.theaterName || '공연장 미정'}</p>
          <dl><div><dt>공연 기간</dt><dd>{show.startDate} — {show.endDate || '미정'}</dd></div>{show.runtime && <div><dt>러닝타임</dt><dd>{show.runtime}</dd></div>}<div><dt>관람 연령</dt><dd>{show.ageLimit || '정보 확인 중'}</dd></div></dl>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            {show.averageScore != null && show.averageScore > 0 ? <span className="flex items-center gap-1.5 text-[13px] text-brand"><Star size={14} fill="currentColor" />{show.averageScore.toFixed(1)}<span className="text-ink-lighter">· 공개 평점 {show.ratingCount ?? 0}개</span></span> : <span className="text-[12px] text-ink-lighter">등록된 평점 없음</span>}
            <button onClick={handleShare} className="text-link" aria-label="공연 공유"><Share2 size={15} />공유</button>
          </div>
        </div>
        <aside className="detail-record-card">
          <h2>관극 기록</h2><p>관람일과 감상을 남깁니다.</p>
          <button onClick={() => openDiaryModal('quick')} className="button-primary w-full"><Plus size={16} />관극 기록하기</button>
          <button onClick={() => { if (!isAuthenticated) { requireLogin('관심 공연을 저장하려면 로그인해 주세요.'); return } toggleFav.mutate() }} disabled={toggleFav.isPending} className="button-secondary w-full mt-2"><Heart size={15} fill={favStatus?.isFavorited ? 'currentColor' : 'none'} />{favStatus?.isFavorited ? '관심 공연 해제' : '관심 공연 저장'}</button>
        </aside>
      </section>
      <div className="detail-mobile-action md:hidden"><button onClick={() => openDiaryModal('quick')} className="button-primary w-full"><Plus size={16} />관극 기록하기</button></div>
      {bookingLinks[0] && <a href={bookingLinks[0].url} target="_blank" rel="noopener noreferrer" className="booking-note"><span>예매 정보</span><span>예매처에서 검색하기 <ArrowUpRight size={14} /></span></a>}
      <div className="mt-4 flex gap-5"><button className="text-action" onClick={() => { if (!isAuthenticated) { sessionStorage.setItem("postLoginRedirect", `/shows/${id}?plan=1`); navigate("/login") } else setShowPlan(true) }}>관람 예정 등록</button><a className="text-action" href="/plans">내 일정</a></div>
      <nav className="book-tabs mt-8" aria-label="공연 상세 정보">
        {TAB_ITEMS.map(tab => <button key={tab.key} aria-pressed={activeTab === tab.key} className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
      </nav>
      <div className="detail-tab-content">
        {activeTab === 'info' && <div className="detail-info-grid"><ShowInfoTab show={show} /><div className="detail-casting-panel"><ShowCastingTab showId={showId} fallbackCastInfo={show.castInfo} /></div></div>}
        {activeTab === 'reviews' && <div className="space-y-8"><ShowReviewsTab show={show} showId={showId} diarySnippets={diarySnippets?.items ?? []} onWriteDiary={() => openDiaryModal('quick')} showReviewForm={showReviewForm} onOpenReviewForm={openReviewForm} onCloseReviewForm={() => setShowReviewForm(false)} /><ShowSeatViewTab show={show} diarySnippets={diarySnippets?.items ?? []} onAddSeatReview={() => openDiaryModal('full')} /></div>}
        {activeTab === 'companion' && <ShowCompanionLiveTab showId={showId} isOngoing={isOngoing} />}
      </div>
      {planOpen && <PlanForm showId={show.id} showTitle={show.title} onClose={closePlan} />}
      {showDiaryForm && <DiaryFormModal entry={editingDiaryEntry} initialShowId={show.id} initialShowTitle={show.title} mode={diaryMode} onClose={() => { setShowDiaryForm(false); setEditingDiaryEntry(undefined) }} onSaved={handleDiarySaved} />}
      {showSavedSheet && savedDiaryEntry && <DiarySavedSheet entry={savedDiaryEntry} onClose={() => { setShowSavedSheet(false); setSavedDiaryEntry(undefined) }} onExpand={() => { setShowSavedSheet(false); setEditingDiaryEntry(savedDiaryEntry); setDiaryMode('full'); setShowDiaryForm(true) }} onWriteReview={() => { setShowSavedSheet(false); setSavedDiaryEntry(undefined); openReviewForm() }} />}
    </div>
  )
}
