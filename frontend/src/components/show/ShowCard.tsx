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
    <Link to={`/shows/${show.id}`} className="group block">
      <div className="relative overflow-hidden rounded-[22px] bg-warm-100 shadow-card-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-md">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
            alt={show.title}
            className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-warm-100 text-gray-400">
            <ImageOff size={24} />
            <span className="text-xs font-medium">포스터 준비 중</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className={STATUS_BADGE[show.status] || 'badge-ended'}>
            {show.statusDisplayName}
          </span>
        </div>
        {show.averageScore !== undefined && show.averageScore !== null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-white/95 px-2.5 py-1 text-xs text-gray-900 shadow-sm backdrop-blur-sm">
            <Star size={11} className="text-gold fill-gold" />
            <span className="font-semibold">{show.averageScore.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="px-0.5 pt-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-950 transition-colors group-hover:text-brand">
          {show.title}
        </h3>
        {show.theaterName && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} />
            <span className="truncate">{show.theaterName}</span>
          </p>
        )}
        {show.startDate && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <CalendarDays size={11} />
            {show.startDate} ~ {show.endDate || ''}
          </p>
        )}
      </div>
    </Link>
  )
}
