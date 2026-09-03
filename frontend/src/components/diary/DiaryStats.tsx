import type { DiaryStats as DiaryStatsType } from '../../types'
import { Sparkles, Star, Receipt, Flame } from 'lucide-react'

interface Props {
  stats?: DiaryStatsType
}

export default function DiaryStats({ stats }: Props) {
  const totalCount = stats?.totalCount ?? 0
  const totalSpent = stats?.totalSpent ?? 0
  const avgRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'
  const topShow = stats?.topShows?.[0]
  const topCast = stats?.topCasts?.[0]

  return (
    <div className="border border-line-base bg-white rounded-md p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-line-lightest pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-brand/10 text-brand">
            <Sparkles size={14} />
          </span>
          <h2 className="text-[14px] font-semibold text-ink-darkest tracking-tight">나의 관극 요약</h2>
        </div>
        <span className="text-[11px] text-ink-muted">
          총 <strong className="text-brand font-bold">{totalCount}</strong>회 관극
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="p-3 bg-surface-base rounded border border-line-lightest">
          <p className="text-[11px] font-medium text-ink-muted">평균 별점</p>
          <p className="mt-1 flex items-center gap-1 text-[16px] font-bold text-ink-darkest">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            {avgRating} <span className="text-[10px] text-ink-lightest font-normal">/ 5.0</span>
          </p>
        </div>

        <div className="p-3 bg-surface-base rounded border border-line-lightest">
          <p className="text-[11px] font-medium text-ink-muted">총 지출 금액</p>
          <p className="mt-1 flex items-center gap-1 text-[16px] font-bold text-ink-darkest">
            <Receipt size={14} className="text-emerald-600" />
            {totalSpent.toLocaleString()}
            <span className="text-[11px] text-ink-muted font-normal">원</span>
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 bg-surface-base rounded border border-line-lightest">
          <p className="text-[11px] font-medium text-ink-muted">최다 관람 작품</p>
          <p className="mt-1 text-[13px] font-semibold text-ink-darkest truncate" title={topShow?.showTitle || '기록 없음'}>
            {topShow ? (
              <>
                <Flame size={13} className="inline text-brand mr-1 -mt-0.5" />
                {topShow.showTitle}{' '}
                <span className="text-[11px] font-normal text-brand font-mono">({topShow.count}회)</span>
              </>
            ) : (
              <span className="text-ink-lighter text-[12px] font-normal">-</span>
            )}
          </p>
          {topCast && (
            <p className="mt-1 text-[10.5px] text-ink-muted truncate">
              최다 관람 배우: <span className="font-medium text-ink-darkest">{topCast.castName}</span> ({topCast.count}회)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
