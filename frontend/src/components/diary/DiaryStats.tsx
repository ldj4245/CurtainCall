import { type ReactNode } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ImageOff, Star } from 'lucide-react'
import type { DiaryStats as DiaryStatsType } from '../../types'

interface Props {
  stats?: DiaryStatsType
}

export default function DiaryStats({ stats }: Props) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 rounded-2xl bg-warm-100" />
      </div>
    )
  }

  const monthlyData = Object.entries(stats.monthlyCount || {})
    .map(([month, count]) => ({ month: month.slice(5), count }))
    .slice(-6)

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-900">관극 통계</p>
        <p className="mt-1 text-sm text-gray-500">최근 기록 흐름과 가장 자주 본 작품, 배우를 볼 수 있습니다.</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatItem label="총 관극 횟수" value={`${stats.totalCount}회`} />
        <StatItem label="총 지출 금액" value={`${(stats.totalSpent / 10000).toFixed(0)}만원`} />
        <StatItem
          label="평균 평점"
          value={stats.averageRating.toFixed(1)}
          icon={<Star size={14} className="fill-gold text-gold" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-warm-50 p-5">
          <h3 className="mb-5 text-sm font-semibold text-gray-700">최근 6개월 관극 수</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(139,34,82,0.05)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f5f3f0',
                    borderRadius: '10px',
                    color: '#1a1a1a',
                  }}
                  formatter={(value) => [`${value}회`, '관극 수']}
                />
                <Bar dataKey="count" fill="#8b2252" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-warm-50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">가장 많이 본 작품</h3>
          {stats.topShows.length > 0 ? (
            <div className="space-y-3">
              {stats.topShows.slice(0, 3).map((show, index) => (
                <div key={show.showId} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-gold-100 text-gold-700'
                        : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {show.posterUrl ? (
                    <img src={show.posterUrl} alt={show.showTitle} className="h-14 w-10 rounded-md border border-gray-100 object-cover" />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded-md border border-gray-100 bg-warm-100 text-gray-400">
                      <ImageOff size={14} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{show.showTitle}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{show.count}회 관람</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center text-sm text-gray-400">
              아직 쌓인 통계가 없습니다.
            </div>
          )}
        </div>

        {stats.topCasts?.length > 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-warm-50 p-5 md:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">가장 많이 본 배우</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {stats.topCasts.slice(0, 5).map((cast, index) => (
                <div key={cast.castName} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-gold-100 text-gold-700'
                        : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{cast.castName}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{cast.count}회 관람</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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
    <div className="rounded-xl border border-gray-100 bg-warm-50 px-4 py-4">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {icon}
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
