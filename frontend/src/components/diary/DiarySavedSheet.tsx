import { Link } from 'react-router-dom'
import type { DiaryEntry } from '../../types'
interface Props { entry: DiaryEntry; onClose: () => void; onExpand: () => void; onWriteReview: () => void }
export default function DiarySavedSheet({ entry, onClose }: Props) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="저장 완료" className="w-full max-w-sm border border-line-base bg-white p-5" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-semibold">저장했습니다.</h2>
      <p className="mt-3">{entry.showTitle}</p><p className="feed-meta">{entry.watchedDate} · {entry.isOpen ? '공개' : '비공개'}</p>
      <div className="mt-5 flex justify-between"><Link to="/diary" className="text-action" onClick={onClose}>내 기록 보기</Link><button autoFocus className="button-primary" onClick={onClose}>완료</button></div>
    </div>
  </div>
}
