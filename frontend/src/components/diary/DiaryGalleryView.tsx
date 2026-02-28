import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, MapPin, Calendar, Armchair, Ticket, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import Pagination from '../common/Pagination'

const ITEMS_PER_PAGE = 12

export default function DiaryGalleryView({ onEdit }: { onEdit: (entry: DiaryEntry) => void }) {
  const [page, setPage] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['diary', 'me', page, 'gallery'],
    queryFn: () => diaryApi.getMyDiary(page, ITEMS_PER_PAGE),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const entries = data?.content ?? []

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {entries.map((entry) => (
          <TicketCard key={entry.id} entry={entry} onClick={() => { setSelectedEntry(entry); setPhotoIndex(0) }} />
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          photoIndex={photoIndex}
          onPhotoIndexChange={setPhotoIndex}
          onEdit={() => { onEdit(selectedEntry); setSelectedEntry(null) }}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  )
}

function TicketCard({ entry, onClick }: { entry: DiaryEntry; onClick: () => void }) {
  const bgImage = entry.representativeImageUrl
  const watchedYear = entry.watchedDate.slice(0, 4)
  const watchedMonthDay = entry.watchedDate.slice(5).replace('-', '/')

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
    >
      {bgImage ? (
        <img
          src={bgImage}
          alt={entry.showTitle}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-200 to-brand-400" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
        <Star size={10} className="text-yellow-400 fill-yellow-400" />
        <span className="text-white text-xs font-semibold">{entry.rating}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">{entry.showTitle}</p>
        <p className="text-white/70 text-xs">{watchedYear}. {watchedMonthDay}</p>
        {entry.theaterName && (
          <p className="text-white/60 text-[10px] truncate mt-0.5">{entry.theaterName}</p>
        )}
      </div>

      {entry.photoUrls?.length > 1 && (
        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <span className="text-white text-[10px]">+{entry.photoUrls.length}</span>
        </div>
      )}
    </button>
  )
}

interface DetailModalProps {
  entry: DiaryEntry
  photoIndex: number
  onPhotoIndexChange: (i: number) => void
  onEdit: () => void
  onClose: () => void
}

function EntryDetailModal({ entry, photoIndex, onPhotoIndexChange, onEdit, onClose }: DetailModalProps) {
  const allPhotos = entry.photoUrls?.length > 0 ? entry.photoUrls : (entry.showPosterUrl ? [entry.showPosterUrl] : [])
  const hasMultiple = allPhotos.length > 1

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-gray-100">
          {allPhotos.length > 0 ? (
            <img
              src={allPhotos[photoIndex]}
              alt={entry.showTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-300 flex items-center justify-center">
              <Ticket size={40} className="text-brand-400" />
            </div>
          )}

          {hasMultiple && (
            <>
              <button
                onClick={() => onPhotoIndexChange(Math.max(0, photoIndex - 1))}
                disabled={photoIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => onPhotoIndexChange(Math.min(allPhotos.length - 1, photoIndex + 1))}
                disabled={photoIndex === allPhotos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {allPhotos.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/40 rounded-full p-1 text-white hover:bg-black/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1 mr-2">{entry.showTitle}</h3>
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < entry.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <span>{entry.watchedDate}</span>
            </div>
            {entry.theaterName && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span>{entry.theaterName}</span>
              </div>
            )}
            {entry.seatInfo && (
              <div className="flex items-center gap-2">
                <Armchair size={13} className="text-gray-400 shrink-0" />
                <span>{entry.seatInfo}</span>
              </div>
            )}
            {entry.ticketPrice != null && (
              <div className="flex items-center gap-2">
                <Ticket size={13} className="text-gray-400 shrink-0" />
                <span>{entry.ticketPrice.toLocaleString()}원</span>
              </div>
            )}
          </div>

          {entry.castMemo && (
            <p className="mt-3 text-xs text-gray-500 bg-warm-50 rounded-lg px-3 py-2">{entry.castMemo}</p>
          )}

          {entry.comment && (
            <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-3">{entry.comment}</p>
          )}

          <button
            onClick={onEdit}
            className="w-full mt-4 btn-secondary text-sm py-2"
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
