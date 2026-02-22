import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpenText, ChevronRight, Search, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { showsApi } from '../../api/shows'
import ShowCard from '../../components/show/ShowCard'
import { useAuthStore } from '../../store/authStore'

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { data: ongoingShows, isLoading } = useQuery({
    queryKey: ['shows', 'ongoing'],
    queryFn: () => showsApi.getOngoing(8),
  })

  return (
    <div className="min-h-screen bg-white">
      <section className="px-4 pt-16 pb-12 md:pt-24 md:pb-16 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          <p className="inline-flex items-center rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand">
            CURTAINCALL
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                공연의 모든 순간을
                <br />
                <span className="text-brand">기록</span>하세요
              </h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg text-gray-500 leading-relaxed">
                최신 공연 탐색, 리뷰 확인, 관극 다이어리 기록과 통계 분석을
                하나의 공간에서 연결해 관극 경험을 체계적으로 관리합니다.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
            <div className="rounded-2xl border border-gray-100 bg-white shadow-card-sm p-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">핵심 기능</p>
              <div className="space-y-3">
                <FeatureRow
                  icon={<Search size={16} />}
                  title="공연 탐색"
                  desc="장르/상태/키워드 기반 필터 검색"
                />
                <FeatureRow
                  icon={<BookOpenText size={16} />}
                  title="관극 다이어리"
                  desc="관람 기록 저장 및 월별 통계 확인"
                />
                <FeatureRow
                  icon={<Star size={16} />}
                  title="리뷰 커뮤니티"
                  desc="세부 평점과 댓글 기반 의사결정"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-warm-50 px-4 py-3">
      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
