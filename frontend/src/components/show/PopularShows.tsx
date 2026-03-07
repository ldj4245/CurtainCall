import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, Flame, ImageOff, MapPin } from 'lucide-react'
import { showsApi } from '../../api/shows'
import type { Show } from '../../types'

export default function PopularShows() {
    const { data: shows, isLoading } = useQuery({
        queryKey: ['shows', 'popular'],
        queryFn: () => showsApi.getPopular(8),
    })

    if (isLoading) {
        return (
            <section className="mb-14 animate-pulse">
                <div className="h-7 bg-warm-100 rounded-lg w-1/3 mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                            <div className="aspect-[3/4] bg-warm-100 rounded-2xl" />
                            <div className="mt-3 space-y-2">
                                <div className="h-4 bg-warm-100 rounded w-3/4" />
                                <div className="h-3 bg-warm-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    if (!shows || shows.length === 0) return null

    return (
        <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    이번 주 인기 공연
                </h2>
                <Link
                    to="/shows"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand font-medium transition-colors"
                >
                    전체보기 <ChevronRight size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {shows.map((show: Show, index: number) => (
                    <Link key={show.id} to={`/shows/${show.id}`} className="group block">
                        <div className="relative overflow-hidden rounded-2xl bg-warm-100 shadow-card-sm group-hover:shadow-card-md transition-all duration-300">
                            {show.posterUrl ? (
                                <img
                                    src={show.posterUrl}
                                    alt={show.title}
                                    className="w-full aspect-[3/4] object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-warm-100 text-gray-400">
                                    <ImageOff size={24} />
                                    <span className="text-xs font-medium">포스터 준비 중</span>
                                </div>
                            )}
                            {/* 순위 뱃지 */}
                            <div className="absolute top-3 left-3 bg-brand text-white text-xs font-extrabold w-7 h-7 rounded-lg flex items-center justify-center shadow-md">
                                {index + 1}
                            </div>
                        </div>
                        <div className="pt-3 px-0.5">
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                                {show.title}
                            </h3>
                            {show.theaterName && (
                                <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                                    <MapPin size={11} />
                                    <span className="truncate">{show.theaterName}</span>
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
