import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CalendarDays, Clock3, DollarSign, Heart, ImageOff, MapPin, Star, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { showsApi } from '../../api/shows'
import { favoritesApi } from '../../api/favorites'
import { useAuthStore } from '../../store/authStore'
import StarRating from '../../components/common/StarRating'
import ReviewList from '../../components/review/ReviewList'
import DiaryFormModal from '../../components/diary/DiaryFormModal'

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)

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

  const toggleFav = useMutation({
    mutationFn: () => favoritesApi.toggle(Number(id)),
    onSuccess: (data) => {
      queryClient.setQueryData(['favorite-status', id], data)
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
      toast.success(data.isFavorited ? '찜 목록에 추가되었습니다.' : '찜 목록에서 제거되었습니다.')
    },
  })

  const requireLogin = (message: string) => {
    sessionStorage.setItem('postLoginRedirect', `/shows/${id}`)
    toast(message)
    navigate('/login', { state: { from: { pathname: `/shows/${id}` } } })
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-8">
          <div className="aspect-[3/4] bg-warm-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-warm-100 rounded w-1/4" />
            <div className="h-10 bg-warm-100 rounded w-2/3" />
            <div className="h-5 bg-warm-100 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-warm-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-800 mb-2">공연 정보를 불러오지 못했습니다</p>
        <p className="text-sm text-gray-500 mb-6">네트워크 상태를 확인한 뒤 다시 시도해주세요.</p>
        <button onClick={() => refetch()} className="btn-primary px-6">
          다시 시도
        </button>
      </div>
    )
  }

  if (!show) return null

  const castList: string[] =
    (show as { castList?: string[] }).castList ||
    (show.castInfo ? show.castInfo.split(',').map((s: string) => s.trim()).filter(Boolean) : [])

  const statusBadgeClass = STATUS_BADGE_CLASS[show.status] || 'badge-ended'
  const genreBadgeClass = GENRE_BADGE_CLASS[show.genre] || 'badge-play'

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-8">
          <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl overflow-hidden shadow-card-md">
              {show.posterUrl ? (
                <img src={show.posterUrl} alt={show.title} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-warm-100 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageOff size={24} />
                  <p className="text-xs font-medium">포스터 준비 중</p>
                </div>
              )}
            </div>

            <div className="card p-4">
              <p className="text-xs font-semibold tracking-wide text-gray-400 mb-3">개인 액션</p>
              <div className="grid gap-2">
                <button
                  onClick={() => {
                    if (!isAuthenticated) return requireLogin('찜 기능은 로그인 후 이용할 수 있어요.')
                    toggleFav.mutate()
                  }}
                  disabled={isAuthenticated && toggleFav.isPending}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all ${favStatus?.isFavorited
                    ? 'border-brand-200 bg-brand-50 text-brand hover:bg-brand-100'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-warm-50'
                    }`}
                >
                  <Heart size={15} className={favStatus?.isFavorited ? 'fill-brand' : ''} />
                  {favStatus?.isFavorited ? '찜 해제' : '찜하기'}
                  {favStatus?.favoriteCount ? <span className="text-xs text-gray-400">({favStatus.favoriteCount})</span> : null}
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) return requireLogin('관람 기록은 로그인 후 이용할 수 있어요.')
                    setShowDiaryForm(true)
                  }}
                  className="btn-primary text-sm px-4 py-2.5"
                >
                  <BookOpen size={15} />
                  관람 기록
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) return requireLogin('리뷰 작성은 로그인 후 이용할 수 있어요.')
                    setShowReviewForm(true)
                  }}
                  className="btn-secondary text-sm px-4 py-2.5"
                >
                  <Star size={15} />
                  리뷰 쓰기
                </button>
              </div>
              {!isAuthenticated && (
                <p className="mt-3 text-xs text-gray-400">로그인하면 찜 저장, 관람 기록, 리뷰 작성을 이용할 수 있어요.</p>
              )}
            </div>
          </aside>

          <section>
            <div className="card p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={statusBadgeClass}>{show.statusDisplayName}</span>
                <span className={genreBadgeClass}>{show.genreDisplayName}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{show.title}</h1>
              <div className="mt-4 flex items-center gap-2">
                {show.averageScore !== undefined && show.averageScore !== null ? (
                  <>
                    <StarRating value={Math.round(show.averageScore)} readonly size="sm" />
                    <span className="text-lg font-semibold text-gray-900">{show.averageScore.toFixed(1)}</span>
                    <span className="text-sm text-gray-400">({show.reviewCount ?? 0}개 리뷰)</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">아직 등록된 평점이 없습니다.</span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoCard icon={<MapPin size={15} />} label="공연장" value={show.theaterName || '정보 없음'} />
                <InfoCard icon={<CalendarDays size={15} />} label="공연 기간" value={show.startDate ? `${show.startDate} ~ ${show.endDate || '미정'}` : '정보 없음'} />
                <InfoCard icon={<Clock3 size={15} />} label="러닝타임" value={show.runtime || '정보 없음'} />
                <InfoCard icon={<DollarSign size={15} />} label="가격 정보" value={show.priceInfo || '정보 없음'} multiline />
              </div>

              {castList.length > 0 && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users size={15} className="text-gray-400" />
                    출연진
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {castList.map((name, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-full border border-gray-100 bg-warm-50 px-3 py-1.5 text-sm text-gray-700">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <ReviewList showId={Number(id)} showReviewForm={showReviewForm} onCloseForm={() => setShowReviewForm(false)} />
            </div>
          </section>
        </div>
      </div>

      {showDiaryForm && show && (
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

function InfoCard({ icon, label, value, multiline }: { icon: ReactNode; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-warm-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <div className={`flex items-start gap-2 ${multiline ? '' : 'items-center'}`}>
        <span className="mt-0.5 text-gray-400">{icon}</span>
        <p className={`text-sm text-gray-800 ${multiline ? 'leading-relaxed' : ''}`}>{value}</p>
      </div>
    </div>
  )
}
