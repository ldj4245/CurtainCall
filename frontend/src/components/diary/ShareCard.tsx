import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Share2, Star } from 'lucide-react'
import type { DiaryStats, DiaryEntry } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  stats?: DiaryStats
  recentEntry?: DiaryEntry
  onClose: () => void
}

export default function ShareCard({ stats, recentEntry, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cardType, setCardType] = useState<'stats' | 'entry'>('stats')

  const today = new Date()
  const monthStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월`

  const downloadCard = async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      const link = document.createElement('a')
      link.download = `curtaincall-${cardType}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast.success('카드가 저장되었습니다!')
    } catch {
      toast.error('이미지 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const shareCard = async () => {
    if (!cardRef.current) return
    if (!navigator.share) {
      toast.error('이 브라우저에서는 공유 기능을 지원하지 않습니다.')
      return
    }
    setIsGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'curtaincall.png', { type: 'image/png' })
      await navigator.share({ files: [file], title: 'CurtainCall 관극 기록' })
    } catch {
      toast.error('공유에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">관극 카드 공유</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 p-3 bg-gray-50 border-b border-gray-100">
          {[
            { id: 'stats', label: '이달의 통계' },
            { id: 'entry', label: '최근 관극' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCardType(id as 'stats' | 'entry')}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                cardType === id ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 flex justify-center">
          {cardType === 'stats' ? (
            <StatsCard ref={cardRef} stats={stats} monthStr={monthStr} />
          ) : (
            <EntryCard ref={cardRef} entry={recentEntry} />
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button
            onClick={downloadCard}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm py-2.5"
          >
            <Download size={16} />
            저장
          </button>
          <button
            onClick={shareCard}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
          >
            <Share2 size={16} />
            {isGenerating ? '생성 중...' : '공유'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { forwardRef } from 'react'

const StatsCard = forwardRef<HTMLDivElement, { stats?: DiaryStats; monthStr: string }>(
  ({ stats, monthStr }, ref) => {
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const thisMonthCount = stats?.monthlyCount?.[currentMonthKey] ?? 0

    return (
      <div
        ref={ref}
        className="w-72 bg-gradient-to-br from-[#1a0a2e] to-[#3d1a5e] rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ fontFamily: 'inherit' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-5">
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-white/80 text-sm font-medium">CurtainCall</span>
          </div>

          <p className="text-white/60 text-xs mb-1">{monthStr}</p>
          <h2 className="text-2xl font-bold mb-5">이달의 관극 기록</h2>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: '이번 달', value: `${thisMonthCount}회` },
              { label: '총 관람', value: `${stats?.totalCount ?? 0}회` },
              { label: '평균 평점', value: `${(stats?.averageRating ?? 0).toFixed(1)}★` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-white/60 text-[10px] mb-0.5">{label}</p>
                <p className="text-white font-bold text-sm">{value}</p>
              </div>
            ))}
          </div>

          {stats?.topShows && stats.topShows.length > 0 && (
            <div>
              <p className="text-white/60 text-xs mb-2">많이 본 공연</p>
              <div className="space-y-1.5">
                {stats.topShows.slice(0, 3).map((show, i) => (
                  <div key={show.showId} className="flex items-center gap-2">
                    <span className="text-white/40 text-xs w-4">{i + 1}</span>
                    <span className="text-white text-xs flex-1 truncate">{show.showTitle}</span>
                    <span className="text-brand-300 text-xs">{show.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-white/40 text-[10px]">curtaincall.app</p>
          </div>
        </div>
      </div>
    )
  }
)
StatsCard.displayName = 'StatsCard'

const EntryCard = forwardRef<HTMLDivElement, { entry?: DiaryEntry }>(({ entry }, ref) => {
  if (!entry) {
    return (
      <div ref={ref} className="w-72 h-96 bg-gray-100 rounded-3xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">관극 기록이 없습니다.</p>
      </div>
    )
  }

  const bgImage = entry.representativeImageUrl

  return (
    <div
      ref={ref}
      className="w-72 relative overflow-hidden rounded-3xl"
      style={{ fontFamily: 'inherit' }}
    >
      <div className="aspect-[3/4] relative">
        {bgImage ? (
          <img src={bgImage} alt={entry.showTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a0a2e] to-[#3d1a5e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < entry.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}
            />
          ))}
        </div>
        <h3 className="text-white font-bold text-xl leading-tight mb-1">{entry.showTitle}</h3>
        <p className="text-white/70 text-sm">{entry.watchedDate}</p>
        {entry.theaterName && (
          <p className="text-white/50 text-xs mt-0.5">{entry.theaterName}</p>
        )}
        {entry.comment && (
          <p className="text-white/80 text-xs mt-3 leading-relaxed line-clamp-2 italic">"{entry.comment}"</p>
        )}
        <div className="mt-4 flex items-center gap-1.5">
          <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">C</span>
          </div>
          <span className="text-white/50 text-[10px]">CurtainCall</span>
        </div>
      </div>
    </div>
  )
})
EntryCard.displayName = 'EntryCard'
