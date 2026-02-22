import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { reviewsApi } from '../../api/reviews'
import { useAuthStore } from '../../store/authStore'
import ReviewCard from './ReviewCard'
import ReviewForm from './ReviewForm'
import Pagination from '../common/Pagination'

interface Props {
  showId: number
  showReviewForm: boolean
  onCloseForm: () => void
}

export default function ReviewList({ showId, showReviewForm, onCloseForm }: Props) {
  const [sort, setSort] = useState<'latest' | 'likes'>('latest')
  const [page, setPage] = useState(0)
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', showId, sort, page],
    queryFn: () => reviewsApi.getByShow(showId, sort, page, 10),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title flex items-center gap-2">
          <MessageCircle size={20} className="text-brand" />
          관객 리뷰 {data && <span className="text-gray-400 text-base font-normal">({data.totalElements})</span>}
        </h2>
        <div className="flex gap-1 bg-warm-100 rounded-lg p-1">
          {(['latest', 'likes'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSort(s); setPage(0) }}
              className={`px-3 py-1 text-sm rounded-md transition-all ${sort === s ? 'bg-white font-medium shadow-sm text-brand' : 'text-gray-500'}`}
            >
              {s === 'latest' ? '최신순' : '인기순'}
            </button>
          ))}
        </div>
      </div>

      {showReviewForm && isAuthenticated && (
        <div className="mb-6">
          <ReviewForm
            showId={showId}
            onSubmitted={() => {
              onCloseForm()
              queryClient.invalidateQueries({ queryKey: ['reviews', showId] })
            }}
            onCancel={onCloseForm}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-warm-100 rounded w-1/4" />
              <div className="h-16 bg-warm-100 rounded" />
            </div>
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="space-y-4">
            {data.content.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onUpdated={() => queryClient.invalidateQueries({ queryKey: ['reviews', showId] })}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
        </div>
      )}
    </div>
  )
}
