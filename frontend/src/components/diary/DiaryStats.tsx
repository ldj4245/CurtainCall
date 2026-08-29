import type { DiaryStats as DiaryStatsType } from '../../types'

interface Props {
  stats?: DiaryStatsType
}

export default function DiaryStats({ stats }: Props) {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <h2 className="border-b border-ink-base pb-3 text-[13px] font-semibold text-ink-base">내 아카이브</h2>
      <div className="mt-4 flex gap-2.5 border-b border-line-lightest pb-4">
        <span className="h-8 w-8 rounded-full bg-[#d9c4b4]" />
        <p className="text-[11px] leading-5 text-ink-muted">
          <b className="block text-[12px] text-ink-base">회원</b>
          {currentYear}년에 기록한 관극
        </p>
      </div>
      <dl className="text-[11px]">
        <div className="flex justify-between border-b border-line-lightest py-2.5">
          <dt className="text-ink-lighter">관람한 공연</dt>
          <dd className="m-0 font-semibold text-ink-base">{stats?.topShows?.length || 0}편</dd>
        </div>
        <div className="flex justify-between border-b border-line-lightest py-2.5">
          <dt className="text-ink-lighter">남긴 기록</dt>
          <dd className="m-0 font-semibold text-ink-base">{stats?.totalCount || 0}개</dd>
        </div>
        <div className="flex justify-between border-b border-line-lightest py-2.5">
          <dt className="text-ink-lighter">가장 많이 간 공연장</dt>
          <dd className="m-0 font-semibold text-ink-base">{stats?.topShows?.[0]?.showTitle || '-'}</dd>
        </div>
      </dl>
    </>
  )
}
