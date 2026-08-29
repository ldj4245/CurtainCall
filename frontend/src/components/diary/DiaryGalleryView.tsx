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
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-surface-background" />
        ))}
      </div>
    )
  }

  const entries = data?.content ?? []

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
      className="group relative aspect-[3/4] overflow-hidden bg-ink-darkest text-left"
    >
      {bgImage ? (
        <img
          src={bgImage}
          alt={entry.showTitle}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-ink-dark" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-darkest/95 via-ink-darkest/20 to-transparent" />

      <div className="absolute right-2 top-2 flex items-center gap-0.5 bg-ink-darkest/80 px-2 py-1 backdrop-blur">
        <Star size={10} className="text-white" />
        <span className="text-white text-[11px] font-semibold">{entry.rating}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="mb-1 line-clamp-2 text-[14px] font-semibold leading-tight tracking-[-0.02em] text-white">{entry.showTitle}</p>
        <p className="text-[11px] text-white/70">{watchedYear}. {watchedMonthDay}</p>
        {entry.theaterName && (
          <p className="mt-0.5 truncate text-[10px] text-white/55">{entry.theaterName}</p>
        )}
      </div>

      {entry.photoUrls?.length > 1 && (
        <div className="absolute left-2 top-2 flex items-center gap-0.5 bg-ink-darkest/80 px-1.5 py-1 backdrop-blur">
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden border border-line-lightest bg-white shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-surface-background">
          {allPhotos.length > 0 ? (
            <img
              src={allPhotos[photoIndex]}
              alt={entry.showTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-background">
              <Ticket size={40} className="text-ink-lighter" />
            </div>
          )}

          {hasMultiple && (
            <>
              <button
                onClick={() => onPhotoIndexChange(Math.max(0, photoIndex - 1))}
                disabled={photoIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-ink-darkest/65 p-1.5 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => onPhotoIndexChange(Math.min(allPhotos.length - 1, photoIndex + 1))}
                disabled={photoIndex === allPhotos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink-darkest/65 p-1.5 text-white disabled:opacity-30"
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
            className="absolute right-2 top-2 bg-ink-darkest/65 p-1.5 text-white transition-colors hover:bg-ink-darkest"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="mr-2 flex-1 text-[17px] font-semibold leading-tight tracking-[-0.03em] text-ink-base">{entry.showTitle}</h3>
            <div className="flex items-center gap-1 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < entry.rating ? 'fill-brand text-brand' : 'text-line-base'}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-[13px] text-ink-muted">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="shrink-0 text-ink-lighter" />
              <span>{entry.watchedDate}</span>
            </div>
            {entry.theaterName && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="shrink-0 text-ink-lighter" />
                <span>{entry.theaterName}</span>
              </div>
            )}
            {entry.seatInfo && (
              <div className="flex items-center gap-2">
                <Armchair size={12} className="shrink-0 text-ink-lighter" />
                <span>{entry.seatInfo}</span>
              </div>
            )}
            {entry.ticketPrice != null && (
              <div className="flex items-center gap-2">
                <Ticket size={12} className="shrink-0 text-ink-lighter" />
                <span>{entry.ticketPrice.toLocaleString()}원</span>
              </div>
            )}
          </div>

          {entry.castMemo && (
            <p className="mt-4 border-l-2 border-line-lightest pl-3 text-[13px] text-ink-muted">{entry.castMemo}</p>
          )}

          {entry.comment && (
            <p className="mt-4 line-clamp-3 text-[13px] leading-6 text-ink-base">{entry.comment}</p>
          )}

          <button
            onClick={onEdit}
            className="mt-5 h-[39px] w-full bg-brand text-[12px] font-semibold text-white"
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
