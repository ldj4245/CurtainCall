import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, List, Calendar, LayoutGrid, Share2, Ticket } from 'lucide-react'
import { diaryApi } from '../../api/diary'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryCalendar from '../../components/diary/DiaryCalendar'
import DiaryGalleryView from '../../components/diary/DiaryGalleryView'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import DiaryStats from '../../components/diary/DiaryStats'
import ShareCard from '../../components/diary/ShareCard'
import Pagination from '../../components/common/Pagination'
import type { DiaryEntry } from '../../types'

type ViewMode = 'list' | 'calendar' | 'gallery'

export default function DiaryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showShare, setShowShare] = useState(false)
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

  const handleEdit = (entry: DiaryEntry) => {
    setEditEntry(entry)
    setShowForm(true)
  }

  const entries = diaryData?.content ?? []
  const recentEntry = entries[0]

  return (
    <>
      <div className="px-4 py-5 sm:px-5">
        {/* 헤더 영역 */}
        <div className="mb-5 flex items-center justify-between border-b border-line-lightest pb-4">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-ink-darkest">관극 다이어리</h1>
            <p className="text-[12px] text-ink-muted mt-0.5">내가 관람한 공연들의 티켓과 추억을 기록합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="h-9 px-3 border border-line-base bg-white rounded-md text-[12px] font-medium text-ink-muted hover:text-ink-darkest hover:border-line-dark transition-colors inline-flex items-center gap-1.5"
                title="티켓 카드 공유"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">티켓 카드</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditEntry(undefined)
                setShowForm(true)
              }}
              className="h-9 px-3.5 bg-brand text-white rounded-md text-[12px] font-semibold hover:bg-brand/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} />
              <span>기록 남기기</span>
            </button>
          </div>
        </div>

        {/* 통계 요약 카드 */}
        <div className="mb-6">
          <DiaryStats stats={stats} />
        </div>

        {/* 3대 뷰 스위처 탭 */}
        <div className="flex items-center justify-between border-b border-line-base mb-4">
          <div className="flex gap-1 -mb-[1px]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                viewMode === 'list'
                  ? 'border-brand font-bold text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink-darkest'
              }`}
            >
              <List size={14} />
              목록
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                viewMode === 'calendar'
                  ? 'border-brand font-bold text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink-darkest'
              }`}
            >
              <Calendar size={14} />
              캘린더
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                viewMode === 'gallery'
                  ? 'border-brand font-bold text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink-darkest'
              }`}
            >
              <LayoutGrid size={14} />
              티켓 갤러리
            </button>
          </div>

          <span className="text-[11px] text-ink-lighter font-medium">
            {viewMode === 'list' && `${diaryData?.totalElements ?? 0}건의 기록`}
          </span>
        </div>

        {/* 뷰 모드별 콘텐츠 */}
        {viewMode === 'list' && (
          <div>
            {entries.length === 0 ? (
              <div className="text-center py-14 border border-line-lightest bg-white rounded-md px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-alt flex items-center justify-center text-ink-lighter">
                  <Ticket size={24} />
                </div>
                <h3 className="text-[15px] font-semibold text-ink-darkest">아직 기록된 관극이 없습니다</h3>
                <p className="text-[12px] text-ink-muted mt-1 max-w-xs mx-auto">
                  첫 번째 관람 공연을 기록하고 나만의 감상과 티켓북을 완성해 보세요.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditEntry(undefined)
                    setShowForm(true)
                  }}
                  className="mt-5 h-9 px-4 bg-brand text-white rounded-md text-[12px] font-semibold hover:bg-brand/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  첫 기록 시작하기
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line-lightest border-t border-line-lightest">
                {entries.map((entry) => (
                  <DiaryEntryCard
                    key={entry.id}
                    entry={entry}
                    onUpdated={() => {
                      refetchDiary()
                      refetchStats()
                    }}
                    onEdit={() => handleEdit(entry)}
                  />
                ))}

                {diaryData && diaryData.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination currentPage={page} totalPages={diaryData.totalPages} onPageChange={setPage} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <DiaryCalendar onSelectEntry={handleEdit} />
        )}

        {viewMode === 'gallery' && (
          <DiaryGalleryView onEdit={handleEdit} />
        )}
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

      {showShare && (
        <ShareCard
          stats={stats}
          recentEntry={recentEntry}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  )
}
