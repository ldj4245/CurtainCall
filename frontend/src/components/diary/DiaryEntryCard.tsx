import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, Edit2, MapPin, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import StarRating from '../common/StarRating'
import ConfirmModal from '../common/ConfirmModal'
import DiaryFormModal from './DiaryFormModal'

interface Props {
  entry: DiaryEntry
  onUpdated: () => void
}

export default function DiaryEntryCard({ entry, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => diaryApi.delete(entry.id),
    onSuccess: () => {
      toast.success('기록을 삭제했습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      onUpdated()
    },
    onError: () => {
      toast.error('기록 삭제에 실패했습니다.')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
    setDeleting(false)
  }

  return (
    <div className="card p-5">
      <div className="flex gap-4">
        {entry.showPosterUrl ? (
          <img
            src={entry.showPosterUrl}
            alt={entry.showTitle}
            className="h-[88px] w-16 shrink-0 rounded-lg object-cover"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/shows/${entry.showId}`}
              className="truncate font-bold text-gray-900 transition-colors hover:text-brand"
            >
              {entry.showTitle}
            </Link>

            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-gray-400 transition-colors hover:text-brand"
                aria-label="기록 수정"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setDeleting(true)}
                className="p-1.5 text-gray-400 transition-colors hover:text-red-500"
                disabled={deleteMutation.isPending}
                aria-label="기록 삭제"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mb-2 mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {entry.watchedDate}
            </span>
            {entry.theaterName ? (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {entry.theaterName}
              </span>
            ) : null}
            {entry.seatInfo ? <span>좌석: {entry.seatInfo}</span> : null}
            {entry.ticketPrice ? <span>{entry.ticketPrice.toLocaleString()}원</span> : null}
          </div>

          <StarRating value={entry.rating} readonly size="sm" />

          {entry.castMemo ? (
            <p className="mt-2 rounded-lg bg-warm-50 px-3 py-2 text-sm text-gray-600">
              캐스트 메모: {entry.castMemo}
            </p>
          ) : null}

          {entry.comment ? (
            <p className="mt-2 line-clamp-2 text-sm text-gray-700">{entry.comment}</p>
          ) : null}
        </div>
      </div>

      {entry.photoUrls?.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {entry.photoUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`사진 ${index + 1}`}
              className="h-16 w-16 shrink-0 rounded-lg border border-gray-100 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      {editing ? (
        <DiaryFormModal
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            onUpdated()
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmModal
          title="관극 기록 삭제"
          message="정말 이 기록을 삭제하시겠습니까? 삭제한 기록은 다시 복구할 수 없습니다."
          confirmText="삭제하기"
          cancelText="취소"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(false)}
        />
      ) : null}
    </div>
  )
}
