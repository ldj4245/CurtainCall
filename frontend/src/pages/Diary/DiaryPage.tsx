import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart2,
  BookOpen,
  CalendarDays,
  LayoutGrid,
  List,
  PenSquare,
  Share2,
} from 'lucide-react'
import { diaryApi } from '../../api/diary'
import DiaryStats from '../../components/diary/DiaryStats'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiaryCalendar from '../../components/diary/DiaryCalendar'
import DiaryGalleryView from '../../components/diary/DiaryGalleryView'
import ShareCard from '../../components/diary/ShareCard'
import Pagination from '../../components/common/Pagination'
import type { DiaryEntry } from '../../types'

const TABS = [
  { key: 'list', label: '기록', icon: List },
  { key: 'calendar', label: '캘린더', icon: CalendarDays },
  { key: 'gallery', label: '갤러리', icon: LayoutGrid },
  { key: 'stats', label: '통계', icon: BarChart2 },
] as const

type DiaryTab = (typeof TABS)[number]['key']

function SummaryPanel({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="paper-panel p-4 sm:p-5">
      <p className="journal-kicker">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  )
}

export default function DiaryPage() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>(undefined)
  const [showShareCard, setShowShareCard] = useState(false)
  const [activeTab, setActiveTab] = useState<DiaryTab>('list')

  const {
    data: diaryData,
    refetch: refetchDiary,
    isLoading: isDiaryLoading,
    isError: isDiaryError,
  } = useQuery({
    queryKey: ['diary', 'me', page],
    queryFn: () => diaryApi.getMyDiary(page, 10),
  })

  const {
    data: stats,
    refetch: refetchStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
  })

  const recentEntry = diaryData?.content?.[0]
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const thisMonthCount = stats?.monthlyCount?.[currentMonthKey] ?? 0

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <section className="paper-panel overflow-hidden p-6 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <p className="journal-kicker">my diary</p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-gray-900 sm:text-4xl">
                관극 기록을 한 곳에서
                <br />
                다시 보고 정리하세요
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                캘린더와 목록, 갤러리, 통계를 한 페이지에서 볼 수 있게 정리했습니다. 공연을 보고 난 뒤
                필요한 기록만 빠르게 남기고, 나중에 다시 찾아보기 쉬운 흐름을 목표로 했습니다.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setEditEntry(undefined)
                    setShowForm(true)
                  }}
                  className="btn-primary w-full justify-between px-5 py-3 sm:w-auto sm:justify-center"
                >
                  <span>새 기록 남기기</span>
                  <PenSquare size={16} />
                </button>
                <button
                  onClick={() => setShowShareCard(true)}
                  className="btn-secondary w-full justify-between px-5 py-3 sm:w-auto sm:justify-center"
                >
                  <span>공유 카드</span>
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <div className="ticket-panel overflow-hidden p-5 sm:p-6">
              <p className="journal-kicker">최근 기록</p>
              {recentEntry ? (
                <div className="mt-4">
                  {recentEntry.showPosterUrl ? (
                    <img
                      src={recentEntry.showPosterUrl}
                      alt={recentEntry.showTitle}
                      className="h-44 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                  <p className="mt-4 text-xl font-semibold tracking-tight text-gray-900">
                    {recentEntry.showTitle}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{recentEntry.watchedDate}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {recentEntry.comment || '최근 기록을 다시 열어 수정하거나 이어서 정리할 수 있습니다.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditEntry(recentEntry)
                      setShowForm(true)
                    }}
                    className="mt-4 text-sm font-semibold text-brand"
                  >
                    이 기록 수정하기
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-brand/20 bg-white/80 px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand">
                    <BookOpen size={20} />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-gray-900">첫 기록을 남겨보세요</p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    관람일과 평점, 짧은 감상만 있어도 충분히 시작할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryPanel
              label="총 관극 수"
              value={`${stats?.totalCount ?? 0}회`}
              description="지금까지 남긴 기록"
            />
            <SummaryPanel
              label="이번 달"
              value={`${thisMonthCount}회`}
              description="이번 달에 본 공연"
            />
            <SummaryPanel
              label="평균 평점"
              value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
              description="남겨 둔 평점 평균"
            />
            <SummaryPanel
              label="최근 공연"
              value={recentEntry?.showTitle ?? '아직 기록 없음'}
              description={recentEntry ? recentEntry.watchedDate : '첫 기록을 남겨보세요'}
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="inline-flex min-w-full gap-1 rounded-2xl bg-warm-100 p-1 sm:min-w-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex min-w-[96px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {activeTab === 'list' && (
              <div className="content-fade-in">
                {isDiaryError ? (
                  <div className="paper-panel px-6 py-16 text-center">
                    <p className="text-lg font-medium text-gray-700">기록 목록을 불러오지 못했어요</p>
                    <button onClick={() => refetchDiary()} className="btn-primary mt-4 px-6">
                      다시 시도
                    </button>
                  </div>
                ) : isDiaryLoading ? (
                  <div className="paper-panel px-6 py-16 text-center text-gray-400">
                    기록을 불러오는 중입니다...
                  </div>
                ) : diaryData && diaryData.content.length > 0 ? (
                  <div className="space-y-4">
                    {diaryData.content.map((entry) => (
                      <DiaryEntryCard key={entry.id} entry={entry} onUpdated={refetchDiary} />
                    ))}
                    <Pagination
                      currentPage={page}
                      totalPages={diaryData.totalPages}
                      onPageChange={setPage}
                    />
                  </div>
                ) : (
                  <div className="paper-panel px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand">
                      <BookOpen size={22} />
                    </div>
                    <p className="mt-5 text-xl font-semibold text-gray-900">아직 기록이 없습니다</p>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      공연을 보고 난 뒤 기억하고 싶은 점부터 가볍게 남겨보세요.
                    </p>
                    <button
                      onClick={() => {
                        setEditEntry(undefined)
                        setShowForm(true)
                      }}
                      className="btn-primary mt-5"
                    >
                      첫 기록 남기기
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="content-fade-in">
                <DiaryCalendar />
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="content-fade-in">
                <DiaryGalleryView
                  onEdit={(entry) => {
                    setEditEntry(entry)
                    setShowForm(true)
                  }}
                />
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="content-fade-in">
                {isStatsError ? (
                  <div className="paper-panel px-6 py-16 text-center">
                    <p className="text-lg font-medium text-gray-700">통계를 불러오지 못했어요</p>
                    <button onClick={() => refetchStats()} className="btn-primary mt-4 px-6">
                      다시 시도
                    </button>
                  </div>
                ) : isStatsLoading ? (
                  <div className="paper-panel px-6 py-16 text-center text-gray-400">
                    통계를 불러오는 중입니다...
                  </div>
                ) : (
                  <DiaryStats stats={stats} />
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <DiaryFormModal
          entry={editEntry}
          onClose={() => {
            setShowForm(false)
            setEditEntry(undefined)
          }}
          onSaved={() => {
            setShowForm(false)
            setEditEntry(undefined)
            refetchDiary()
            refetchStats()
          }}
        />
      )}

      {showShareCard && (
        <ShareCard
          stats={stats}
          recentEntry={recentEntry}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  )
}
