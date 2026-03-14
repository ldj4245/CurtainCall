import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, BookOpen, Users, MessageCircle } from 'lucide-react'
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

  const featuredShow = ongoingShows?.find((s) => s.posterUrl)

  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">

            {/* 텍스트 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.92] tracking-tighter">
                공연을
                <br />
                <span className="text-brand">기록하는</span>
                <br />
                공간
              </h1>
              <p className="mt-6 text-base text-gray-500 leading-relaxed max-w-xs">
                관극 다이어리, 공연 검색, 동행 찾기.
                <br />
                당신의 모든 공연 경험을 여기에.
              </p>
              <div className="mt-8 flex gap-3">
                <Link
                  to="/shows"
                  className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  공연 찾기
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/signup"
                    className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    시작하기
                  </Link>
                )}
              </div>
            </div>

            {/* 피처드 포스터 */}
            {featuredShow && (
              <div className="flex-shrink-0 flex gap-4 items-end">
                <Link
                  to={`/shows/${featuredShow.id}`}
                  className="group block w-44 md:w-52"
                >
                  <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={featuredShow.posterUrl!}
                      alt={featuredShow.title}
                      className="w-full aspect-[3/4] object-cover"
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-400 text-center truncate px-1">
                    {featuredShow.title}
                  </p>
                </Link>
                {ongoingShows?.filter(s => s.posterUrl && s.id !== featuredShow.id).slice(0, 1).map(s => (
                  <Link
                    key={s.id}
                    to={`/shows/${s.id}`}
                    className="group block w-32 md:w-36 mb-6"
                  >
                    <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/10 group-hover:scale-[1.02] transition-transform duration-300">
                      <img
                        src={s.posterUrl!}
                        alt={s.title}
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 기능 소개 - 비로그인만 */}
      {!isAuthenticated && (
        <section className="py-14 px-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link to="/signup" className="group p-6 rounded-2xl border border-gray-100 hover:border-brand/30 hover:bg-brand-50/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand/10 transition-colors">
                  <BookOpen className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">관극 다이어리</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  본 공연 날짜, 좌석, 별점, 사진을 기록해두면 나중에 찾아보기 편해요.
                </p>
              </Link>

              <Link to="/signup" className="group p-6 rounded-2xl border border-gray-100 hover:border-brand/30 hover:bg-brand-50/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand/10 transition-colors">
                  <Users className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">동행 매칭</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  같은 공연 같은 날 볼 사람을 구하고, 매칭되면 채팅방이 열려요.
                </p>
              </Link>

              <Link to="/signup" className="group p-6 rounded-2xl border border-gray-100 hover:border-brand/30 hover:bg-brand-50/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand/10 transition-colors">
                  <MessageCircle className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">오늘 라이브</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  공연 끝나고 같은 날 본 사람들이랑 바로 얘기할 수 있어요.
                </p>
              </Link>
            </div>
          </div>
        </section>
      )}

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
