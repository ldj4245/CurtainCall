import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, PenSquare, Star } from 'lucide-react'
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
  const seatDataStarted = Boolean(entry.seatInfo || entry.viewRating)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-card-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-brand">기록이 저장되었습니다</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">{entry.showTitle}</h2>
          <p className="mt-1 text-sm text-gray-500">{entry.watchedDate} 관람</p>
          {seatDataStarted ? (
            <p className="mt-3 rounded-xl bg-warm-50 px-3 py-2 text-sm text-gray-700">
              이번 기록부터 좌석과 시야 정보도 함께 쌓이기 시작합니다.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 py-5">
          <StatCard label="이번 달 관극" value={`${thisMonthCount}회`} />
          <StatCard label="총 기록 수" value={`${stats?.totalCount ?? 0}개`} />
          <StatCard
            label="평균 별점"
            value={stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
          />
          <StatCard label="최근 기록" value={recentTitle} multiline />
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="grid gap-2">
            <Link to="/diary" className="btn-secondary justify-between" onClick={onClose}>
              <span>전체 기록 보기</span>
              <BookOpen size={16} />
            </Link>
            <button onClick={onExpand} className="btn-secondary justify-between">
              <span>추가 정보 입력</span>
              <PenSquare size={16} />
            </button>
            <button onClick={onWriteReview} className="btn-primary justify-between">
              <span>후기 남기기</span>
              <Star size={16} />
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
    <div className="rounded-xl border border-gray-100 bg-warm-50 px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-2 font-bold text-gray-900 ${multiline ? 'line-clamp-2 text-sm' : 'text-xl'}`}>{value}</p>
    </div>
  )
}
