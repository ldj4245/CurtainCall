import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import StarRating from '../common/StarRating'
import DiaryFormModal from './DiaryFormModal'

interface Props {
  entry: DiaryEntry
  onUpdated: () => void
}

export default function DiaryEntryCard({ entry, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => diaryApi.delete(entry.id),
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      onUpdated()
    },
  })

  const handleDelete = () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="card p-5">
      <div className="flex gap-4">
        {entry.showPosterUrl && (
          <img
            src={entry.showPosterUrl}
            alt={entry.showTitle}
            className="w-16 h-22 object-cover rounded-lg shrink-0"
            style={{ height: '88px' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate">{entry.showTitle}</h3>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1 mb-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {entry.watchedDate}
            </span>
            {entry.theaterName && (
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {entry.theaterName}
              </span>
            )}
            {entry.seatInfo && <span>좌석: {entry.seatInfo}</span>}
            {entry.ticketPrice && (
              <span>{entry.ticketPrice.toLocaleString()}원</span>
            )}
          </div>

          <StarRating value={entry.rating} readonly size="sm" />

          {entry.castMemo && (
            <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
              캐스트 메모: {entry.castMemo}
            </p>
          )}
          {entry.comment && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{entry.comment}</p>
          )}
        </div>
      </div>

      {editing && (
        <DiaryFormModal
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdated() }}
        />
      )}
    </div>
  )
}
