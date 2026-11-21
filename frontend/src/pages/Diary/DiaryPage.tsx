import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { diaryApi } from '../../api/diary'
import DiaryEntryCard from '../../components/diary/DiaryEntryCard'
import DiaryCalendar from '../../components/diary/DiaryCalendar'
import DiaryGalleryView from '../../components/diary/DiaryGalleryView'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import InstallApp from '../../components/common/InstallApp'
import ShareCard from '../../components/diary/ShareCard'
import Pagination from '../../components/common/Pagination'
import { getThisMonthDiaryCount } from '../../utils/diaryReminder'
import type { DiaryEntry } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'

type ViewMode = 'list' | 'gallery' | 'calendar'

export default function DiaryPage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [copyEntry, setCopyEntry] = useState<DiaryEntry>()
  const [params, setParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [showShare, setShowShare] = useState(params.has("month"))
  const [editEntry, setEditEntry] = useState<DiaryEntry>()
  const { data: diaryData, isLoading, isError, refetch } = useQuery({
    queryKey: ['diary', 'me', page],
    queryFn: () => diaryApi.getMyDiary(page, 10),
    enabled: isAuthenticated,
  })
  const { data: stats } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
    enabled: isAuthenticated,
  })
  const entries = diaryData?.content ?? []
  const formOpen = showForm || params.get('compose') === '1'

  const closeForm = () => {
    setShowForm(false)
    setEditEntry(undefined)
    setCopyEntry(undefined)
    if (params.has('compose')) {
      const next = new URLSearchParams(params)
      next.delete('compose')
      setParams(next, { replace: true })
    }
  }

  const openNew = () => {
    setCopyEntry(undefined)
    setEditEntry(undefined)
    setShowForm(true)
  }

  const edit = (entry: DiaryEntry) => {
    setCopyEntry(undefined)
    setEditEntry(entry)
    setShowForm(true)
  }

  return (
    <div className="page-width">
      <header className="page-heading flex flex-wrap items-center justify-between gap-4">
        <h1>내 관극 기록</h1>
        <div className="flex items-center gap-2">
          {entries.length > 0 && <button onClick={() => setShowShare(true)} className="button-secondary">공유 카드</button>}
          <button onClick={openNew} className="button-primary">기록하기</button>
        </div>
      </header>

      {!isAuthenticated && (
        <div className="mb-6 border border-line-base bg-white p-5">
          <p className="text-[13px] text-ink-base leading-relaxed">
            로그인 전에도 공연과 관람일을 먼저 작성해 볼 수 있습니다. 저장 시 로그인하면 입력한 내용이 그대로 이어집니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={openNew} className="button-primary">기록 시작하기</button>
            <Link to="/shows" className="button-secondary">공연 찾아보기</Link>
          </div>
        </div>
      )}
      {(stats?.totalCount ?? 0) > 0 && (
        <dl className="book-summary">
          <div><dt>전체 기록</dt><dd>{stats?.totalCount}<small>개</small></dd></div>
          <div><dt>이번 달 관람</dt><dd>{getThisMonthDiaryCount(stats)}<small>회</small></dd></div>
          <div><dt>누적 지출</dt><dd>{stats?.totalSpent.toLocaleString()}<small>원</small></dd></div>
        </dl>
      )}

      {(stats?.totalCount ?? 0) > 0 && <InstallApp />}
      {isAuthenticated && (
        <nav className="book-tabs" aria-label="기록 보기 방식">
          {([
            { value: 'list', label: '목록' },
            { value: 'gallery', label: '포스터' },
            { value: 'calendar', label: '달력' },
          ] as const).map(({ value, label }) => (
            <button key={value} aria-pressed={viewMode === value} onClick={() => setViewMode(value)} className={viewMode === value ? 'is-active' : ''}>
              {label}
            </button>
          ))}
          <span className="ml-auto text-[12px] text-ink-lighter">{diaryData?.totalElements ?? 0}개의 기록</span>
        </nav>
      )}

      {isAuthenticated && (isLoading ? (
        <div className="diary-feed animate-pulse" aria-label="기록 불러오는 중">
          {[0, 1, 2].map((row) => (
            <div key={row} className="diary-entry border-b border-line-lightest space-y-2">
              <div className="h-4 w-2/5 bg-[#eceae6]" />
              <div className="h-3 w-1/3 bg-[#eceae6]" />
              <div className="h-3 w-3/4 bg-[#eceae6]" />
            </div>
          ))}
        </div>
      )
        : isError ? <div className="quiet-empty"><p>기록을 불러오지 못했습니다.</p><button onClick={() => refetch()} className="button-secondary">다시 시도</button></div>
        : entries.length === 0 ? <div className="quiet-empty"><p>관극 기록이 없습니다.</p><button onClick={openNew} className="text-action">기록하기</button></div>
        : viewMode === 'gallery' ? <DiaryGalleryView onEdit={edit} />
        : viewMode === 'calendar' ? <DiaryCalendar onSelectEntry={edit} />
        : <>
            <div className="diary-feed">
              {entries.map(entry => <DiaryEntryCard key={entry.id} entry={entry} onCopy={() => { setCopyEntry(entry); setEditEntry(undefined); setShowForm(true) }} onEdit={() => edit(entry)} onUpdated={() => refetch()} />)}
            </div>
            {diaryData && diaryData.totalPages > 1 && (
              <div className="mt-6"><Pagination currentPage={page} totalPages={diaryData.totalPages} onPageChange={setPage} /></div>
            )}
          </>)}

      {formOpen && <DiaryFormModal entry={editEntry} copyEntry={copyEntry} mode="quick" onClose={closeForm} onSaved={() => { closeForm(); setPage(0) }} />}
      {showShare && <ShareCard initialMonth={params.get("month") || undefined} stats={stats} recentEntry={entries[0]} onClose={() => setShowShare(false)} />}
    </div>
  )
}
