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
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.035em] text-[#172033]">
          <MessageCircle size={18} />
          관객 후기 {data && <span className="text-[13px] font-normal text-[#8993a4]">{data.totalElements}</span>}
        </h2>
        <div className="flex border border-[#e5e8ee] bg-white p-0.5">
          {(['latest', 'likes'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSort(s); setPage(0) }}
              className={`px-3 py-1.5 text-[12px] transition-colors ${sort === s ? 'bg-[#f1f3f5] font-semibold text-[#172033]' : 'text-[#8993a4] hover:text-[#536076]'}`}
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
              queryClient.invalidateQueries({ queryKey: ['show', showId] })
              queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
            }}
            onCancel={onCloseForm}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 border-b border-[#e5e8ee] py-5">
              <div className="h-4 w-1/4 animate-pulse bg-[#f1f3f5]" />
              <div className="h-16 animate-pulse bg-[#f1f3f5]" />
            </div>
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div className="divide-y divide-[#e5e8ee]">
            {data.content.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['reviews', showId] })
                  queryClient.invalidateQueries({ queryKey: ['show', showId] })
                  queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
                }}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><MessageCircle size={18} /></div>
          <p className="text-[13px] text-[#697386]">등록된 후기가 없습니다. 첫 감상을 남겨 보세요.</p>
        </div>
      )}
    </div>
  )
}
