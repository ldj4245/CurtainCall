import type { Show } from '../../types'
import ReviewList from '../review/ReviewList'
import PublicRecords from './PublicRecords'

interface Props {
  show: Show
  showId: number
  onWriteDiary: () => void
  showReviewForm: boolean
  onCloseReviewForm: () => void
}

export default function ShowReviewsTab({ show, showId, onWriteDiary, showReviewForm, onCloseReviewForm }: Props) {
  return (
    <div className="space-y-6">
      <PublicRecords showId={showId} onWriteDiary={onWriteDiary} />
      {(show.reviewCount ?? 0) > 0 && (
        <details>
          <summary className="text-sm cursor-pointer text-ink-muted">기존 상세 후기 ({show.reviewCount})</summary>
          <div className="mt-4">
            <ReviewList showId={showId} showReviewForm={showReviewForm} onCloseForm={onCloseReviewForm} />
          </div>
        </details>
      )}
    </div>
  )
}
