import { Link } from 'react-router-dom'
import type { Show } from '../../types'
import Poster from '../common/Poster'

interface Props {
  show: Show
  index?: number
}

export default function ShowCard({ show, index }: Props) {
  const date = (value?: string) => value?.replace(/-/g, '.')
  const genre = show.genreDisplayName || (show.genre === 'MUSICAL' ? '뮤지컬' : '연극')
  const runtime = show.runtime?.trim()
  const castInfo = show.castInfo?.trim()

  return (
    <article className="feed-item">
      {index != null && <span className="feed-index" aria-hidden="true">{index + 1}</span>}
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
