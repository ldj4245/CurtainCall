import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { diaryApi } from '../../api/diary'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiaryStats from '../../components/diary/DiaryStats'
import Pagination from '../../components/common/Pagination'
import type { DiaryEntry } from '../../types'

export default function DiaryPage() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | undefined>(undefined)

  const {
    data: diaryData,
    refetch: refetchDiary,
  } = useQuery({
    queryKey: ['diary', 'me', page],
    queryFn: () => diaryApi.getMyDiary(page, 10),
  })

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
  })

  return (
    <>
      <div className="px-4 py-4 sm:px-5">
      <p className="text-[10px] text-ink-lightest mb-1.5">홈&nbsp; › &nbsp;<span className="text-ink-light">관극 기록</span></p>
      
      <div className="mb-5 flex items-end justify-between border-b border-line-lightest pb-3">
        <h1 className="text-[18px] font-semibold tracking-[-0.05em] text-ink-darker">나의 관극 기록</h1>
        <button type="button" onClick={() => { setEditEntry(undefined); setShowForm(true) }} className="h-8 bg-brand px-3 text-[11px] font-semibold text-white hover:bg-brand/90 transition-colors">
          기록 남기기
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6">
        <DiaryStats stats={stats} />
      </div>

      {/* 기록 피드 */}
      <div>
        <div className="flex items-center justify-between border-b border-line-lightest pb-3 mb-4">
          <h2 className="text-[14px] font-semibold text-ink-base">
            {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
          </h2>
          <div className="flex items-center gap-1 text-[11px] text-ink-lighter">
            <span>{new Date().getMonth() + 1}월</span>
          </div>
        </div>
        
        {diaryData?.content?.map((entry) => (
          <DiaryEntryCard 
            key={entry.id} 
            entry={entry} 
            onUpdated={() => { refetchDiary(); refetchStats() }} 
            onEdit={() => { setEditEntry(entry); setShowForm(true) }} 
          />
        ))}
        
        {diaryData && diaryData.totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={diaryData.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
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
            setPage(0)
            refetchDiary()
            refetchStats()
          }}
        />
      )}
    </>
  )
}
