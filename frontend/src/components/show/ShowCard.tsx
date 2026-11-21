import { Link } from 'react-router-dom'
import type { Show } from '../../types'
import Poster from '../common/Poster'

interface Props {
  show: Show
  index?: number
  rank?: number | null
  showEndingBadge?: boolean
}

function formatEndingLabel(endDate?: string): string | null {
  if (!endDate) return null
  const [y, m, d] = endDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const todayUtc = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  const endUtc = Date.UTC(y, m - 1, d)
  const diffDays = Math.round((endUtc - todayUtc) / 86400000)
  if (diffDays === 0) return '오늘 막공'
  if (diffDays > 0 && diffDays <= 30) return `D-${diffDays}`
  return null
}

export default function ShowCard({ show, index, rank, showEndingBadge = false }: Props) {
  const date = (value?: string) => value?.replace(/-/g, '.')
  const genre = show.genreDisplayName || (show.genre === 'MUSICAL' ? '뮤지컬' : '연극')
  const runtime = show.runtime?.trim()
  const castInfo = show.castInfo?.trim()
  const displayIndex = rank != null ? rank : (index != null ? index + 1 : null)
  const endingLabel = showEndingBadge ? formatEndingLabel(show.endDate) : null

  return (
    <article className="feed-item">
      {displayIndex != null && <span className="feed-index" aria-hidden="true">{displayIndex}</span>}
      <Link to={`/shows/${show.id}`} className="feed-thumb" aria-hidden="true" tabIndex={-1}>
        <Poster src={show.posterUrl} title={show.title} className="w-full h-full" />
      </Link>
      <div className="feed-item-body">
        <div className="feed-title-line">
          <h2><Link to={`/shows/${show.id}`}>{show.title}</Link></h2>
          {show.theaterName && <span className="feed-venue">({show.theaterName})</span>}
        </div>
        {castInfo && <p className="feed-description">출연 {castInfo}</p>}
        <p className="feed-meta">
          <span>{genre}</span>
          {show.status === 'UPCOMING' && <span>공연예정</span>}
          {endingLabel && <span>{endingLabel}</span>}
          <span>{date(show.startDate)}{show.endDate && ` ~ ${date(show.endDate)}`}</span>
          {runtime && <span>{runtime}</span>}
          {show.theaterRegion && <span>{show.theaterRegion}</span>}
        </p>
        <div className="feed-links">
          <Link to={`/shows/${show.id}`}>상세</Link>
          <span aria-hidden="true">·</span>
          <Link to={`/shows/${show.id}?tab=reviews`}>
            후기{show.reviewCount != null ? ` ${show.reviewCount}개` : ''}
          </Link>
        </div>
      </div>
    </article>
  )
}
