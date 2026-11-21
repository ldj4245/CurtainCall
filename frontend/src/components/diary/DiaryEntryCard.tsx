import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import ConfirmModal from '../common/ConfirmModal'
import { retentionApi } from '../../api/retention'
import { track } from '../../utils/analytics'

interface Props {
  entry: DiaryEntry
  onUpdated: () => void
  onEdit: () => void
  onCopy?: () => void
}

export default function DiaryEntryCard({ entry, onUpdated, onEdit, onCopy }: Props) {
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => diaryApi.delete(entry.id),
    onSuccess: () => {
      toast.success('기록을 삭제했습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['public-records', entry.showId] })
      queryClient.invalidateQueries({ queryKey: ['show', entry.showId] })
      onUpdated()
    },
    onError: () => toast.error('기록을 삭제하지 못했습니다.'),
  })

  return (
    <article className="diary-entry">
      <h2><Link to={`/shows/${entry.showId}`}>{entry.showTitle}</Link></h2>
      {entry.comment && <p className="feed-description">{entry.comment}</p>}
      <p className="feed-meta">
        <time>{entry.watchedDate}</time>
        {entry.theaterName && <span>{entry.theaterName}</span>}
        {entry.seatInfo && <span>{entry.seatInfo}</span>}
        {entry.rating != null && <span>평점 {entry.rating.toFixed(1)}</span>}
        <span>{entry.isOpen ? '공개' : '비공개'}</span>
      </p>
      {entry.castMemo && <p className="feed-meta">출연 {entry.castMemo}</p>}
      <div className="feed-links">
        <button type="button" onClick={onEdit}>수정</button>
        {onCopy && <button type="button" onClick={onCopy}>다시 관람</button>}
        {entry.isOpen && <button type="button" onClick={() => { void retentionApi.share(entry.id).then(async r => { await navigator.clipboard.writeText(new URL(r.path, location.origin).href); track("share_link_created", entry.showId); toast.success("링크를 복사했습니다.") }).catch(() => toast.error("공유 링크를 만들지 못했습니다.")) }}>링크 복사</button>}
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => setDeleting(true)}>삭제</button>
        {entry.photoUrls.length > 0 && <span>사진 {entry.photoUrls.length}장</span>}
      </div>
      {deleting && (
        <ConfirmModal
          title="관극 기록 삭제"
          message={`'${entry.showTitle}' 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.`}
          confirmText="삭제"
          cancelText="취소"
          variant="danger"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </article>
  )
}
