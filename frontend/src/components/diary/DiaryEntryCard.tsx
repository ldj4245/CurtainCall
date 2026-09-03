import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import ConfirmModal from '../common/ConfirmModal'

interface Props {
  entry: DiaryEntry
  onUpdated: () => void
  onEdit: () => void
}

export default function DiaryEntryCard({ entry, onUpdated, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => diaryApi.delete(entry.id),
    onSuccess: () => {
      toast.success('기록을 삭제했습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      onUpdated()
    },
  })

  return (
    <article className="flex gap-3.5 border-b border-line-lightest py-4 transition-colors">
      <div className="relative h-[102px] w-[76px] flex-shrink-0 overflow-hidden rounded bg-surface-alt border border-line-lightest">
        {entry.representativeImageUrl || entry.showPosterUrl ? (
          <img
            src={entry.representativeImageUrl || entry.showPosterUrl}
            alt={entry.showTitle}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-lighter text-[11px]">No Image</div>
        )}
        {entry.photoUrls && entry.photoUrls.length > 0 && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-medium">
            +{entry.photoUrls.length}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <time className="text-[11px] font-semibold text-brand tracking-tight">{entry.watchedDate}</time>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <span>★</span>
              <span className="text-ink-darkest">{entry.rating.toFixed(1)}</span>
            </div>
          </div>

          <h2 className="mt-0.5 text-[14px] font-semibold text-ink-darkest tracking-tight truncate">
            <Link to={`/shows/${entry.showId}`} className="hover:text-brand transition-colors">
              {entry.showTitle}
            </Link>
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
            {entry.theaterName && <span>{entry.theaterName}</span>}
            {entry.seatInfo && (
              <>
                <span className="text-line-dark">·</span>
                <span className="text-ink-base font-medium">{entry.seatInfo}</span>
              </>
            )}
          </div>

          {(entry.comment || entry.castMemo) && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted line-clamp-2">
              {entry.comment || entry.castMemo}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {entry.isOpen ? (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                공개
              </span>
            ) : (
              <span className="text-[10px] text-ink-lightest bg-surface-alt px-1.5 py-0.5 rounded border border-line-lightest font-medium">
                비공개
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="h-7 px-2.5 rounded border border-line-base bg-white text-[11px] font-medium text-ink-muted hover:text-ink-darkest hover:border-line-dark transition-colors"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => setDeleting(true)}
              className="h-7 px-2.5 rounded border border-line-base bg-white text-[11px] font-medium text-ink-muted hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {deleting && (
        <ConfirmModal
          title="관극 기록 삭제"
          message={`'${entry.showTitle}' 기록을 정말 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.`}
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
