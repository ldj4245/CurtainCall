import type { Show, DiarySnippet } from '../../types'
import PublicRecords from './PublicRecords'
interface Props { show: Show; diarySnippets: DiarySnippet[]; onAddSeatReview: () => void }
export default function ShowSeatViewTab({ show, onAddSeatReview }: Props) {
  return <div className="space-y-4"><PublicRecords showId={show.id} seatsOnly /><button onClick={onAddSeatReview} className="text-action">좌석 기록 쓰기</button></div>
}
