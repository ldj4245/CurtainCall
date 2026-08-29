import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import { getThisMonthDiaryCount } from '../../utils/diaryReminder'

interface Props {
  entry: DiaryEntry
  onClose: () => void
  onExpand: () => void
  onWriteReview: () => void
}

export default function DiarySavedSheet({ entry, onClose, onExpand, onWriteReview }: Props) {
  const { data: stats } = useQuery({
    queryKey: ['diary', 'stats'],
    queryFn: diaryApi.getStats,
  })

  const { data: recentDiaryPage } = useQuery({
    queryKey: ['diary', 'me', 'recent-home'],
    queryFn: () => diaryApi.getMyDiary(0, 1),
  })

  const recentTitle = recentDiaryPage?.content?.[0]?.showTitle ?? entry.showTitle
  const thisMonthCount = getThisMonthDiaryCount(stats)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm border border-line-lightest bg-white shadow-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-line-lightest px-5 py-5">
          <p className="text-[10px] text-ink-lightest">Record saved</p>
          <h2 className="mt-2 truncate text-[19px] font-semibold tracking-[-0.03em] text-ink-darker">{entry.showTitle}</h2>
          <p className="mt-1 text-[12px] text-ink-lighter">{entry.watchedDate}</p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-line-lightest border-b border-line-lightest px-5 py-5">
          <StatCard label="이번 달" value={`${thisMonthCount}회`} />
          <StatCard label="총 기록" value={`${stats?.totalCount ?? 0}개`} />
          <StatCard
            label="평균 평점"
            value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
          />
          <StatCard label="최근 기록" value={recentTitle} multiline />
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-2">
            <Link to="/diary" className="h-[39px] w-full border border-line-base bg-white text-center text-[12px] leading-[39px] text-ink-muted" onClick={onClose}>
              전체 보기
            </Link>
            <button onClick={onExpand} className="h-[39px] w-full border border-line-base bg-white text-[12px] text-ink-muted">
              추가 정보 입력
            </button>
            <button onClick={onWriteReview} className="h-[39px] w-full bg-brand text-[12px] font-semibold text-white">
              후기 작성
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] text-ink-lighter">{label}</p>
      <p className={`mt-1.5 font-semibold text-ink-base ${multiline ? 'line-clamp-1 text-[13px]' : 'text-[17px] tracking-[-0.03em]'}`}>{value}</p>
    </div>
  )
}
