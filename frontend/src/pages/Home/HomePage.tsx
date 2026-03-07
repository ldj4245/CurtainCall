import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { showsApi } from '../../api/shows'
import ShowCard from '../../components/show/ShowCard'
import PopularShows from '../../components/show/PopularShows'
import RecentCompanions from '../../components/companion/RecentCompanions'
import { useAuthStore } from '../../store/authStore'

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { data: ongoingShows, isLoading } = useQuery({
    queryKey: ['shows', 'ongoing'],
    queryFn: () => showsApi.getOngoing(8),
  })

  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 */}
      <section className="px-4 pt-16 pb-12 md:pt-24 md:pb-16 bg-warm-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand">
            CURTAINCALL
          </p>
          <h1 className="mt-6 text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            공연 찾고, 기록하고,
            <br />
            같이 보러 가자.
          </h1>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shows" className="btn-primary text-base px-7 py-3">
              공연 둘러보기
            </Link>
            {!isAuthenticated && (
              <Link to="/signup" className="btn-secondary text-base px-7 py-3">
                무료로 시작하기
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 🔥 인기 공연 */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <PopularShows />
        </div>
      </section>

      {/* 🤝 동행 위젯 */}
      <section className="py-12 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          <RecentCompanions />
        </div>
      </section>

      {/* 🎭 지금 공연 중인 작품 */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title text-2xl">지금 공연 중인 작품</h2>
            <Link
              to="/shows?status=ONGOING"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand font-medium transition-colors"
            >
              전체보기 <ChevronRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-warm-100 rounded-2xl" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-warm-100 rounded w-3/4" />
                    <div className="h-3 bg-warm-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {ongoingShows?.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
