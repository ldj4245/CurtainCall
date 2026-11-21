import type { Show, DiarySnippet } from '../../types'
import ReviewList from '../review/ReviewList'
import PublicRecords from './PublicRecords'
interface Props { show: Show; showId: number; diarySnippets: DiarySnippet[]; onWriteDiary: () => void; showReviewForm: boolean; onOpenReviewForm: () => void; onCloseReviewForm: () => void }
export default function ShowReviewsTab({ show, showId, onWriteDiary, onCloseReviewForm }: Props) {
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-ink-muted">기록을 공개하면 이곳에 표시됩니다.</p><button onClick={onWriteDiary} className="button-secondary">기록 쓰기</button></div>
    <PublicRecords showId={showId} />
    {(show.reviewCount ?? 0) > 0 && <details><summary className="text-sm cursor-pointer">기존 상세 후기 ({show.reviewCount})</summary><div className="mt-4"><ReviewList showId={showId} showReviewForm={false} onCloseForm={onCloseReviewForm} /></div></details>}
  </div>
}
