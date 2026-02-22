import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ImageOff, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DiaryStats as DiaryStatsType } from '../../types'

interface Props {
  stats?: DiaryStatsType
}

export default function DiaryStats({ stats }: Props) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-gray-100 rounded-2xl border border-gray-200" />
      </div>
    )
  }

  const monthlyData = Object.entries(stats.monthlyCount || {})
    .map(([month, count]) => ({ month: month.slice(5), count }))
    .slice(-6)

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">MY STAGE REPORT</p>
        <h2 className="text-2xl font-bold text-gray-900">나의 관극 리포트</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatItem label="총 관극 횟수" value={`${stats.totalCount}회`} />
        <StatItem label="총 지출 금액" value={`${(stats.totalSpent / 10000).toFixed(0)}만원`} />
        <StatItem
          label="평균 평점"
          value={`${stats.averageRating.toFixed(1)}점`}
          icon={<Star size={14} className="fill-amber-500 text-amber-500" />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">최근 6개월 관람</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(17,24,39,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    color: '#111827',
                  }}
                  formatter={(value) => [`${value}회`, '관람 수']}
                />
                <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">가장 많이 본 작품</h3>
          {stats.topShows.length > 0 ? (
            <div className="space-y-3">
              {stats.topShows.slice(0, 3).map((show, i) => (
                <div key={show.showId} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {show.posterUrl ? (
                    <img src={show.posterUrl} alt={show.showTitle} className="w-10 h-14 object-cover rounded-md border border-gray-200" />
                  ) : (
                    <div className="w-10 h-14 rounded-md border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center">
                      <ImageOff size={14} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-gray-900 text-sm">{show.showTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{show.count}회 관람</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-28 flex items-center justify-center text-gray-500 text-sm">
              아직 통계가 부족합니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {icon}
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
