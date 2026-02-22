import { Link } from 'react-router-dom'
import { CalendarDays, ImageOff, MapPin, Star } from 'lucide-react'
import type { Show } from '../../types'

interface ShowCardProps {
  show: Show
}

const STATUS_BADGE: Record<string, string> = {
  ONGOING: 'badge-ongoing',
  ENDED: 'badge-ended',
  UPCOMING: 'badge-upcoming',
}

export default function ShowCard({ show }: ShowCardProps) {
  return (
    <Link to={`/shows/${show.id}`} className="group card-shadow block">
      <div className="relative overflow-hidden rounded-t-2xl bg-gray-100">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
            alt={show.title}
            className="w-full aspect-[3/4] object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400">
            <ImageOff size={24} />
            <span className="text-xs font-medium">포스터 준비 중</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={STATUS_BADGE[show.status] || 'badge-ended'}>
            {show.statusDisplayName}
          </span>
        </div>
        {show.averageScore !== undefined && show.averageScore !== null && (
          <div className="absolute bottom-3 right-3 bg-white/95 border border-gray-200 text-gray-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Star size={11} className="text-amber-500 fill-amber-500" />
            <span className="font-semibold">{show.averageScore.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors">
          {show.title}
        </h3>
        {show.theaterName && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <MapPin size={11} />
            <span className="truncate">{show.theaterName}</span>
          </p>
        )}
        {show.startDate && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <CalendarDays size={11} />
            {show.startDate} ~ {show.endDate || ''}
          </p>
        )}
      </div>
    </Link>
  )
}
