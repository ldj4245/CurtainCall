import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Calendar, Heart, Star, Share2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { favoritesApi } from '../../api/favorites'
import { showsApi } from '../../api/shows'
import { communityApi } from '../../api/community'
import PlanForm from '../../components/plan/PlanForm'
import { track } from '../../utils/analytics'
import Poster from '../../components/common/Poster'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiarySavedSheet from '../../components/diary/DiarySavedSheet'
import ShowCastingTab from '../../components/show/ShowCastingTab'
import ShowInfoTab from '../../components/show/ShowInfoTab'
import ShowReviewsTab from '../../components/show/ShowReviewsTab'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry } from '../../types'
import { summarizePriceRange } from '../../utils/showUtils'
import { formatCommunityDate } from '../Community/constants'

type DetailTab = 'info' | 'reviews' | 'community'

const TAB_ITEMS: { key: DetailTab; label: string }[] = [
  { key: 'info', label: '공연 정보' },
  { key: 'reviews', label: '후기 · 시야' },
  { key: 'community', label: '커뮤니티 글' },
]

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const showId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const activeTab: DetailTab =
    tabParam === 'reviews' ? 'reviews' : tabParam === 'community' ? 'community' : 'info'
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

  useEffect(() => {
    if (!isAuthenticated && params.get('plan') === '1' && Number.isFinite(showId) && showId > 0) {
      sessionStorage.setItem('postLoginRedirect', `/shows/${showId}?plan=1`)
      toast('관람 예정을 등록하려면 로그인해 주세요.')
      navigate('/login', { state: { from: { pathname: `/shows/${showId}`, search: '?plan=1' } }, replace: true })
    }
  }, [isAuthenticated, navigate, params, showId])

  const { data: show, isLoading, isError, refetch } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.getById(showId),
    enabled: Number.isFinite(showId) && showId > 0,
  })

  const { data: favStatus } = useQuery({
    queryKey: ['favorite-status', id],
    queryFn: () => favoritesApi.getStatus(showId),
    enabled: Number.isFinite(showId) && showId > 0 && isAuthenticated,
  })

  const { data: relatedPosts } = useQuery({
    queryKey: ['community-posts', 'show', showId],
    queryFn: () => communityApi.getPosts({ showId, size: 10 }),
    enabled: Number.isFinite(showId) && showId > 0,
  })

  const toggleFav = useMutation({
    mutationFn: () => favoritesApi.toggle(showId),
    onSuccess: (data) => {
      queryClient.setQueryData(['favorite-status', id], data)
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success(data.isFavorited ? '찜 목록에 추가했습니다.' : '찜 목록에서 제거했습니다.')
    },
  })

  const requireLogin = (message: string, targetPath = `/shows/${id}`) => {
    sessionStorage.setItem('postLoginRedirect', targetPath)
    toast(message)
    navigate('/login', { state: { from: { pathname: `/shows/${id}`, search: targetPath.includes('plan=1') ? '?plan=1' : '' } } })
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

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      requireLogin('관심 공연을 저장하려면 로그인해 주세요.')
      return
    }
    toggleFav.mutate()
  }

  const handleOpenPlan = () => {
    if (!isAuthenticated) {
      requireLogin('관람 예정을 등록하려면 로그인해 주세요.', `/shows/${id}?plan=1`)
      return
    }
    setShowPlan(true)
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

  const priceSummary = summarizePriceRange(show.priceInfo)
  const runtimeText = show.runtime?.trim()
  const ageText = show.ageLimit?.trim()

  const planOpen = isAuthenticated && (showPlan || params.get("plan") === "1")
  const closePlan = () => { setShowPlan(false); const next = new URLSearchParams(params); next.delete("plan"); setParams(next, { replace: true }) }
  const handleShare = async () => {
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
          <p className="eyebrow">
            <span>{show.genreDisplayName || '공연'}</span>
            <span className="!tracking-normal">{show.statusDisplayName}</span>
            {show.popularityRank != null && show.popularityRank <= 20 && (
              <span className="!tracking-normal">박스오피스 {show.popularityRank}위</span>
            )}
          </p>
          <h1>{show.title}</h1>
          <p className="detail-theater">
            {show.theaterName || '공연장 미정'}
            {show.theaterRegion && ` · ${show.theaterRegion}`}
          </p>
          <dl>
            <div><dt>공연 기간</dt><dd>{show.startDate} — {show.endDate || '미정'}</dd></div>
            {runtimeText && <div><dt>러닝타임</dt><dd>{runtimeText}</dd></div>}
            {ageText && <div><dt>관람 연령</dt><dd>{ageText}</dd></div>}
            {priceSummary && <div><dt>티켓 가격</dt><dd>{priceSummary}</dd></div>}
          </dl>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            {show.averageScore != null && show.averageScore > 0 ? <span className="flex items-center gap-1.5 text-[13px] text-brand"><Star size={14} fill="currentColor" />{show.averageScore.toFixed(1)}<span className="text-ink-lighter">· 공개 평점 {show.ratingCount ?? 0}개</span></span> : <span className="text-[12px] text-ink-lighter">등록된 평점 없음</span>}
            <button onClick={handleShare} className="text-link" aria-label="공연 공유"><Share2 size={15} />공유</button>
          </div>
        </div>
        <aside className="detail-record-card">
          <h2>관극 기록</h2><p>관람일과 감상을 남깁니다.</p>
          <button onClick={() => openDiaryModal('quick')} className="button-primary w-full"><Plus size={16} />관극 기록하기</button>
          <button onClick={handleToggleFavorite} disabled={toggleFav.isPending} className="button-secondary w-full mt-2"><Heart size={15} fill={favStatus?.isFavorited ? 'currentColor' : 'none'} />{favStatus?.isFavorited ? '관심 공연 해제' : '관심 공연 저장'}</button>
          <button onClick={handleOpenPlan} className="button-secondary w-full mt-2"><Calendar size={14} />관람 예정 등록</button>
          <div className="mt-2"><Link to="/plans" className="text-action">내 일정 보기</Link></div>
        </aside>
      </section>
      <div className="detail-mobile-action md:hidden">
        <button onClick={() => openDiaryModal('quick')} className="button-primary flex-1 min-w-[140px]"><Plus size={16} />관극 기록하기</button>
        <button onClick={handleToggleFavorite} disabled={toggleFav.isPending} className="button-secondary"><Heart size={15} fill={favStatus?.isFavorited ? 'currentColor' : 'none'} />{favStatus?.isFavorited ? '찜 해제' : '찜'}</button>
        <button onClick={handleOpenPlan} className="button-secondary"><Calendar size={14} />관람 예정</button>
      </div>
      <nav className="book-tabs mt-8" aria-label="공연 상세 정보">
        {TAB_ITEMS.map(tab => {
          const suffix = tab.key === 'community' && relatedPosts && relatedPosts.totalElements > 0
            ? ` (${relatedPosts.totalElements})`
            : ''
          return (
            <button
              key={tab.key}
              aria-pressed={activeTab === tab.key}
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}{suffix}
            </button>
          )
        })}
      </nav>
      <div className="detail-tab-content">
        {activeTab === 'info' && <div className="detail-info-grid"><ShowInfoTab show={show} /><div className="detail-casting-panel"><ShowCastingTab showId={showId} fallbackCastInfo={show.castInfo} /></div></div>}
        {activeTab === 'reviews' && <ShowReviewsTab show={show} showId={showId} onWriteDiary={() => openDiaryModal('quick')} showReviewForm={showReviewForm} onCloseReviewForm={() => setShowReviewForm(false)} />}
        {activeTab === 'community' && (
          <section className="space-y-4" aria-label="관련 커뮤니티 글">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-ink-muted">
                이 공연과 연결된 커뮤니티 글 {relatedPosts?.totalElements ?? 0}건
              </p>
              <Link
                to={`/community/new?showId=${show.id}&showTitle=${encodeURIComponent(show.title)}`}
                className="button-primary"
              >
                이 공연으로 글쓰기
              </Link>
            </div>
            {relatedPosts?.content.length ? (
              <div className="feed-list border-t border-line-base">
                {relatedPosts.content.map((post) => (
                  <article key={post.id} className="feed-item">
                    <div className="feed-item-body">
                      <div className="feed-title-line">
                        <span className="text-[12px] text-[#777] shrink-0">{post.categoryDisplayName}</span>
                        <h2>
                          <Link to={`/community/${post.id}`}>{post.title}</Link>
                        </h2>
                        {post.commentCount > 0 && (
                          <span className="text-[13px] font-medium text-[#555]">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="feed-meta">
                        <span>{post.authorNickname}</span>
                        <time dateTime={post.createdAt}>{formatCommunityDate(post.createdAt)}</time>
                        <span>공감 {post.likeCount}</span>
                        <span>조회 {post.viewCount}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="feed-notice border-t border-line-base">
                아직 이 공연과 연결된 커뮤니티 글이 없습니다. 첫 이야기를 남겨 보세요.
              </p>
            )}
          </section>
        )}
      </div>
      {planOpen && <PlanForm showId={show.id} showTitle={show.title} onClose={closePlan} />}
      {showDiaryForm && <DiaryFormModal entry={editingDiaryEntry} initialShowId={show.id} initialShowTitle={show.title} mode={diaryMode} onClose={() => { setShowDiaryForm(false); setEditingDiaryEntry(undefined) }} onSaved={handleDiarySaved} />}
      {showSavedSheet && savedDiaryEntry && <DiarySavedSheet entry={savedDiaryEntry} onClose={() => { setShowSavedSheet(false); setSavedDiaryEntry(undefined) }} onExpand={() => { setShowSavedSheet(false); setEditingDiaryEntry(savedDiaryEntry); setDiaryMode('full'); setShowDiaryForm(true) }} onWriteReview={() => { setShowSavedSheet(false); setSavedDiaryEntry(undefined); openReviewForm() }} />}
    </div>
  )
}
