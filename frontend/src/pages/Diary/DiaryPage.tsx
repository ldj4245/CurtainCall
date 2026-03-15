import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart2, BookOpen, CalendarDays, LayoutGrid, List, PlusCircle, ScanLine, Share2 } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import DiaryCalendar from '../../components/diary/DiaryCalendar'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiaryGalleryView from '../../components/diary/DiaryGalleryView'
import DiaryStats from '../../components/diary/DiaryStats'
import ShareCard from '../../components/diary/ShareCard'
import TicketDraftUploadModal from '../../components/diary/TicketDraftUploadModal'
import Pagination from '../../components/common/Pagination'
import type { DiaryEntry, TicketDraftResponse } from '../../types'
import { getDiaryReminder, getThisMonthDiaryCount, getDaysSinceWatched } from '../../utils/diaryReminder'

type DiaryTab = 'list' | 'calendar' | 'gallery' | 'stats'

export default function DiaryPage() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showTicketDraft, setShowTicketDraft] = useState(false)
  const [ticketDraft, setTicketDraft] = useState<TicketDraftResponse | undefined>()
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
  const reminder = getDiaryReminder(stats, recentEntry)
  const thisMonthCount = getThisMonthDiaryCount(stats)
  const daysSinceRecent = getDaysSinceWatched(recentEntry)
  const seatDataReminder =
    recentEntry && !recentEntry.seatInfo && !recentEntry.viewRating
      ? '최근 기록에 좌석이나 시야 정보가 없습니다. 다음 기록부터 함께 남겨 보세요.'
      : null

  const openManualForm = () => {
    setEditEntry(undefined)
    setTicketDraft(undefined)
    setShowForm(true)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관극 패스포트</h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            최근 기록과 이번 달 관극 흐름을 한 곳에서 보고, 티켓 이미지로 더 빠르게 기록을 시작할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowShareCard(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-brand/30 hover:text-brand sm:w-auto sm:px-3 sm:gap-1.5"
            title="공유 카드"
          >
            <Share2 size={16} />
            <span className="hidden text-sm font-medium sm:inline">공유</span>
          </button>

          <button onClick={() => setShowTicketDraft(true)} className="btn-secondary px-3 py-2 text-sm">
            <ScanLine size={16} />
            <span>티켓으로 시작</span>
          </button>

          <button onClick={openManualForm} className="btn-primary px-3 py-2 text-sm">
            <PlusCircle size={16} />
            <span>새 기록</span>
          </button>
        </div>
      </div>

      {reminder ? (
        <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
          <p className="text-sm font-semibold text-gray-900">{reminder.title}</p>
          <p className="mt-1 text-sm text-gray-600">{reminder.description}</p>
        </div>
      ) : null}

      {seatDataReminder ? (
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-sm text-gray-700">
          {seatDataReminder}
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="이번 달 관극" value={`${thisMonthCount}회`} />
        <SummaryCard label="총 기록 수" value={`${stats?.totalCount ?? 0}개`} />
        <SummaryCard label="평균 별점" value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'} />
        <SummaryCard
          label="최근 기록"
          value={
            recentEntry
              ? `${recentEntry.showTitle}${daysSinceRecent !== null ? ` · ${daysSinceRecent}일 전` : ''}`
              : '아직 없음'
          }
          multiline
        />
      </div>

      <div className="mb-5 flex gap-0.5 rounded-xl bg-warm-100 p-1">
        {[
          { key: 'list', label: '목록', icon: <List size={14} /> },
          { key: 'calendar', label: '캘린더', icon: <CalendarDays size={14} /> },
          { key: 'gallery', label: '갤러리', icon: <LayoutGrid size={14} /> },
          { key: 'stats', label: '통계', icon: <BarChart2 size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as DiaryTab)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === key ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'list' ? (
        <div className="content-fade-in">
          {isDiaryError ? (
            <ErrorState message="기록 목록을 불러오지 못했습니다." onRetry={refetchDiary} />
          ) : isDiaryLoading ? (
            <LoadingState message="기록을 불러오는 중입니다." />
          ) : diaryData && diaryData.content.length > 0 ? (
            <div className="space-y-4">
              {diaryData.content.map((entry) => (
                <DiaryEntryCard key={entry.id} entry={entry} onUpdated={refetchDiary} />
              ))}
              <Pagination currentPage={page} totalPages={diaryData.totalPages} onPageChange={setPage} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-16 text-center text-gray-500">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand">
                <BookOpen size={20} />
              </div>
              <p className="text-lg font-medium text-gray-700">아직 관극 기록이 없습니다.</p>
              <p className="mt-1 text-sm">티켓 이미지로 시작하거나 첫 감상부터 가볍게 남겨 보세요.</p>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <button onClick={() => setShowTicketDraft(true)} className="btn-primary px-5 py-2.5">
                  티켓으로 시작
                </button>
                <button onClick={openManualForm} className="btn-secondary px-5 py-2.5">
                  직접 기록하기
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'calendar' ? (
        <div className="content-fade-in">
          <DiaryCalendar />
        </div>
      ) : null}

      {activeTab === 'gallery' ? (
        <div className="content-fade-in">
          <DiaryGalleryView
            onEdit={(entry) => {
              setEditEntry(entry)
              setTicketDraft(undefined)
              setShowForm(true)
            }}
          />
        </div>
      ) : null}

      {activeTab === 'stats' ? (
        <div className="content-fade-in">
          {isStatsError ? (
            <ErrorState message="통계를 불러오지 못했습니다." onRetry={refetchStats} />
          ) : isStatsLoading ? (
            <LoadingState message="통계를 불러오는 중입니다." />
          ) : (
            <DiaryStats stats={stats} />
          )}
        </div>
      ) : null}

      {showForm ? (
        <DiaryFormModal
          entry={editEntry}
          initialDraft={ticketDraft}
          mode={ticketDraft ? 'quick' : 'full'}
          onClose={() => {
            setShowForm(false)
            setEditEntry(undefined)
            setTicketDraft(undefined)
          }}
          onSaved={() => {
            setShowForm(false)
            setEditEntry(undefined)
            setTicketDraft(undefined)
            setPage(0)
            setActiveTab('list')
            refetchDiary()
            refetchStats()
          }}
        />
      ) : null}

      {showTicketDraft ? (
        <TicketDraftUploadModal
          onClose={() => setShowTicketDraft(false)}
          onDraftReady={(draft) => {
            setShowTicketDraft(false)
            setEditEntry(undefined)
            setTicketDraft(draft)
            setShowForm(true)
          }}
        />
      ) : null}

      {showShareCard ? (
        <ShareCard
          stats={stats}
          recentEntry={diaryData?.content?.[0]}
          onClose={() => setShowShareCard(false)}
        />
      ) : null}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 font-bold text-gray-900 ${multiline ? 'text-base leading-6' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-medium text-gray-600">{message}</p>
      <button onClick={onRetry} className="btn-primary mt-4 px-6">
        다시 시도
      </button>
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return <div className="py-16 text-center text-gray-400">{message}</div>
}
