import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle, BarChart2, CalendarDays, List, BookOpen, LayoutGrid, Share2 } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import DiaryStats from '../../components/diary/DiaryStats'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiaryCalendar from '../../components/diary/DiaryCalendar'
import DiaryGalleryView from '../../components/diary/DiaryGalleryView'
import ShareCard from '../../components/diary/ShareCard'
import Pagination from '../../components/common/Pagination'
import type { DiaryEntry } from '../../types'

export default function DiaryPage() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>(undefined)
  const [showShareCard, setShowShareCard] = useState(false)
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'gallery' | 'stats'>('calendar')


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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관극 다이어리</h1>
          <p className="text-gray-400 mt-1">
            총 <span className="font-semibold text-brand">{stats?.totalCount ?? 0}</span>회 관람
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareCard(true)}
            className="flex items-center gap-2 btn-secondary"
          >
            <Share2 size={16} />
            공유 카드
          </button>
          <button
            onClick={() => { setEditEntry(undefined); setShowForm(true) }}
            className="flex items-center gap-2 btn-primary"
          >
            <PlusCircle size={18} />
            기록 추가
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-warm-100 p-1 rounded-xl w-fit mb-6">
        {[
          { key: 'calendar', label: '캘린더', icon: <CalendarDays size={14} /> },
          { key: 'list', label: '목록', icon: <List size={14} /> },
          { key: 'gallery', label: '갤러리', icon: <LayoutGrid size={14} /> },
          { key: 'stats', label: '통계', icon: <BarChart2 size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'calendar' | 'list' | 'gallery' | 'stats')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

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
            <div className="text-center py-16">
              <p className="text-lg font-medium text-gray-600">통계를 불러오지 못했어요</p>
              <button onClick={() => refetchStats()} className="btn-primary mt-4 px-6">
                다시 시도
              </button>
            </div>
          ) : isStatsLoading ? (
            <div className="text-center py-16 text-gray-400">통계 불러오는 중...</div>
          ) : (
            <DiaryStats stats={stats} />
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="content-fade-in">
          {isDiaryError ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-gray-600">기록 목록을 불러오지 못했어요</p>
              <button onClick={() => refetchDiary()} className="btn-primary mt-4 px-6">
                다시 시도
              </button>
            </div>
          ) : isDiaryLoading ? (
            <div className="text-center py-16 text-gray-400">기록 불러오는 중...</div>
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
            <div className="text-center py-20 text-gray-400">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-50 text-brand flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <p className="text-lg font-medium">아직 관극 기록이 없어요.</p>
              <p className="text-sm mt-1">공연을 보셨다면 기록을 남겨보세요!</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                첫 기록 추가하기
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <DiaryFormModal
          entry={editEntry}
          onClose={() => { setShowForm(false); setEditEntry(undefined) }}
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
          recentEntry={diaryData?.content?.[0]}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  )
}
