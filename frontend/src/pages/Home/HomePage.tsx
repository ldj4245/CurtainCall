import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { diaryApi } from '../../api/diary'
import { showsApi } from '../../api/shows'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import ShowCard from '../../components/show/ShowCard'
import TodayScheduleSection from '../../components/show/TodayScheduleSection'
import { useAuthStore } from '../../store/authStore'
import type { DiaryEntry } from '../../types'
import { getThisMonthDiaryCount } from '../../utils/diaryReminder'

const GENRE_TABS = [
  { label: '전체', genre: '' },
  { label: '뮤지컬', genre: 'MUSICAL' },
  { label: '연극', genre: 'PLAY' },
] as const

type GenreKey = '' | 'MUSICAL' | 'PLAY'

function ShowSection({
  title,
  linkTo,
  shows,
  isLoading,
  limit,
}: {
  title: string
  linkTo?: string
  shows: any[]
  isLoading: boolean
  limit: number
}) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="text-[13px] font-semibold text-ink-base tracking-[-0.03em]">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-[11px] text-ink-lightest hover:text-ink-muted underline underline-offset-4">
            전체 보기
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
              <article key={i} className="min-w-0">
                <div className="aspect-[2/3] bg-surface-muted animate-pulse" />
                <div className="mt-2 h-3 w-4/5 bg-surface-muted animate-pulse" />
                <div className="mt-1 h-2.5 w-1/2 bg-surface-muted animate-pulse" />
              </article>
            ))
          : shows.slice(0, limit).map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore()
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>()
  const [activeGenre, setActiveGenre] = useState<GenreKey>('')

  // 1. 홈 섹션 데이터
  const { data: homeSections, isLoading: homeSectionsLoading } = useQuery({
    queryKey: ['shows', 'home-sections'],
    queryFn: () => showsApi.getHomeSections(8),
  })

  // 2. 장르 탭 데이터
  const { data: genrePopular, isLoading: genrePopularLoading } = useQuery({
    queryKey: ['shows', 'popular', activeGenre],
    queryFn: () => showsApi.getPopular(8, activeGenre),
    enabled: activeGenre !== '',
  })

  // 3. 사용자 통계 (로그인 시)
  const { data: stats } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
    enabled: isAuthenticated,
  })

  const thisMonthCount = getThisMonthDiaryCount(stats)
  const totalCount = stats?.totalCount ?? 0

  const popular = homeSections?.popular ?? []
  const endingSoon = homeSections?.endingSoon ?? []
  const openingThisMonth = homeSections?.openingThisMonth ?? []
  const mostRecorded = homeSections?.mostRecorded ?? []

  const isAllTab = activeGenre === ''
  const activeTabLabel = GENRE_TABS.find((t) => t.genre === activeGenre)?.label ?? '전체'

  return (
    <div className="px-4 py-4 sm:px-5">
      {/* 헤더 */}
      <div className="mb-4 pb-2.5 border-b border-line-lightest flex items-end justify-between">
        <h1 className="text-[17px] font-bold tracking-[-0.04em] text-ink-darker">공연</h1>
        <span className="text-[10px] text-ink-lightest">
          {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
        </span>
      </div>

      {/* 나의 관극 기록 위젯 (로그인 시) */}
      {isAuthenticated && (
        <div className="mb-5 p-3.5 border border-line-base bg-surface-alt/50 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-ink-darkest">
              {user?.nickname}님의 관극 기록
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              이번 달 <strong className="text-brand font-semibold">{thisMonthCount}회</strong> · 누적 <strong className="text-ink-darkest font-semibold">{totalCount}건</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDiaryForm(true)}
            className="h-7 px-2.5 bg-ink-darkest text-white text-[10px] font-semibold hover:bg-brand transition-colors"
          >
            기록 남기기
          </button>
        </div>
      )}

      {/* 장르 탭 */}
      <div className="flex gap-6 border-b border-line-lightest mb-5">
        {GENRE_TABS.map(({ label, genre }) => (
          <button
            key={genre}
            onClick={() => setActiveGenre(genre as GenreKey)}
            className={`text-[12px] pb-2.5 -mb-px border-b-[1.5px] transition-colors ${
              activeGenre === genre
                ? 'border-ink-darkest font-semibold text-ink-darker'
                : 'border-transparent text-ink-lightest hover:text-ink-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 오늘의 공연 타임테이블 */}
      <TodayScheduleSection genre={activeGenre} />

      {/* 탭 콘텐츠 */}
      {isAllTab ? (
        <>
          <ShowSection
            title="인기 공연"
            linkTo="/shows"
            shows={popular}
            isLoading={homeSectionsLoading}
            limit={8}
          />
          {endingSoon.length > 0 && (
            <ShowSection
              title="곧 종료되는 공연"
              linkTo="/shows?status=ONGOING"
              shows={endingSoon}
              isLoading={homeSectionsLoading}
              limit={4}
            />
          )}
          {openingThisMonth.length > 0 && (
            <ShowSection
              title="이번 달 개막"
              linkTo="/shows?status=UPCOMING"
              shows={openingThisMonth}
              isLoading={homeSectionsLoading}
              limit={4}
            />
          )}
          {mostRecorded.length > 0 && (
            <ShowSection
              title="관객 기록이 많은 공연"
              shows={mostRecorded}
              isLoading={homeSectionsLoading}
              limit={4}
            />
          )}
        </>
      ) : (
        <ShowSection
          title={`${activeTabLabel} 인기 순위`}
          linkTo={`/shows?genre=${activeGenre}`}
          shows={genrePopular ?? []}
          isLoading={genrePopularLoading}
          limit={8}
        />
      )}

      {/* 빠른 탐색 바로가기 */}
      <div className="mt-10 pt-5 border-t border-line-lightest mb-4">
        <h2 className="text-[11px] font-semibold text-ink-muted mb-2.5">빠른 탐색</h2>
        <div className="grid grid-cols-3 gap-1.5">
          <Link
            to="/shows?genre=MUSICAL&status=ONGOING"
            className="flex items-center justify-center h-8 border border-line-base bg-surface-base text-[10px] text-ink-muted hover:border-line-dark transition-colors"
          >
            공연중 뮤지컬
          </Link>
          <Link
            to="/shows?genre=PLAY&status=ONGOING"
            className="flex items-center justify-center h-8 border border-line-base bg-surface-base text-[10px] text-ink-muted hover:border-line-dark transition-colors"
          >
            공연중 연극
          </Link>
          <Link
            to="/shows?status=UPCOMING"
            className="flex items-center justify-center h-8 border border-line-base bg-surface-base text-[10px] text-ink-muted hover:border-line-dark transition-colors"
          >
            공연 예정
          </Link>
        </div>
      </div>

      {showDiaryForm && (
        <DiaryFormModal
          entry={editEntry}
          onClose={() => {
            setShowDiaryForm(false)
            setEditEntry(undefined)
          }}
          onSaved={() => {
            setShowDiaryForm(false)
            setEditEntry(undefined)
          }}
        />
      )}
    </div>
  )
}
