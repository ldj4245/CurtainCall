import { Link } from 'react-router-dom'
import type { Show } from '../../types'

interface ShowCardProps {
  show: Show
  className?: string
}

const statusMap: Record<string, { label: string; color: string }> = {
  ONGOING: { label: '공연중', color: 'bg-brand text-white' },
  UPCOMING: { label: '공연예정', color: 'bg-ink-darkest text-white' },
  ENDED: { label: '종료', color: 'bg-line-base text-ink-lighter' },
}

const genreMap: Record<string, string> = {
  MUSICAL: '뮤지컬',
  PLAY: '연극',
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ShowCard({ show, className = 'aspect-[2/3]' }: ShowCardProps) {
  const statusInfo = show.status ? statusMap[show.status] : null
  const genreLabel = show.genre ? genreMap[show.genre] : null

  return (
    <article className="min-w-0">
      <Link to={`/shows/${show.id}`} className="group block">
        {/* 포스터 */}
        <div className={`relative overflow-hidden bg-surface-muted ${className}`}>
          {show.posterUrl ? (
            <img
              src={show.posterUrl}
              alt={show.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <>
              <span className="absolute left-[19%] top-[16%] h-[52%] w-[58%] border border-ink-lightest opacity-50" />
              <strong className="absolute bottom-[11%] left-[10%] whitespace-pre-line font-serif text-[clamp(14px,2vw,22px)] leading-[0.86] tracking-[-0.09em] text-ink-lightest opacity-60">
                NO{'\n'}POSTER
              </strong>
            </>
          )}
          {/* 상태 뱃지 */}
          {statusInfo && show.status !== 'ENDED' && (
            <span className={`absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* 정보 */}
        <div className="mt-2.5">
          {genreLabel && (
            <p className="text-[9px] font-medium text-ink-lightest mb-0.5 tracking-wide">
              {genreLabel}
            </p>
          )}
          <h3 className="truncate text-[12px] font-semibold text-ink-base group-hover:text-brand leading-tight">
            {show.title}
          </h3>
          <p className="mt-0.5 text-[10px] text-ink-lightest truncate">
            {show.theaterName || '공연장 미정'}
          </p>
          {(show.startDate || show.endDate) && (
            <p className="mt-0.5 text-[10px] text-ink-lightest">
              {formatDate(show.startDate?.toString())}
              {show.endDate && ` ~ ${formatDate(show.endDate?.toString())}`}
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
