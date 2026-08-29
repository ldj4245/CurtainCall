import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { showsApi } from '../../api/shows'
import type { Show } from '../../types'
import ShowCard from './ShowCard'

export default function PopularShows() {
  const { data: popularShows, isLoading: popularLoading } = useQuery({ queryKey: ['shows', 'popular'], queryFn: () => showsApi.getPopular(8) })
  const { data: ongoingShows, isLoading: ongoingLoading } = useQuery({ queryKey: ['shows', 'ongoing-fallback'], queryFn: () => showsApi.getOngoing(8), enabled: !popularLoading && !popularShows?.length })
  const shows = popularShows?.length ? popularShows : ongoingShows
  const isLoading = popularLoading || (!popularShows?.length && ongoingLoading)

  if (isLoading) {
    return (
      <section className="mt-8 first:mt-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-ink-base">인기 공연</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <article key={i} className="min-w-0">
              <div className="aspect-[0.7] bg-surface-muted animate-pulse" />
              <div className="mt-2.5 h-3 w-3/4 bg-surface-muted animate-pulse" />
              <div className="mt-1 h-2 w-1/2 bg-surface-muted animate-pulse" />
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (!shows?.length) return null

  return (
    <section className="mt-8 first:mt-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-ink-base">인기 공연</h2>
        <Link to="/shows" className="text-[11px] text-ink-lighter underline underline-offset-4">전체 보기</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
        {shows.slice(0, 8).map((show: Show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </section>
  )
}
