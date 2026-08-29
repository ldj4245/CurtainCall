import { forwardRef, useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { Download, Image as ImageIcon, Share2, X } from 'lucide-react'
import type { DiaryEntry, DiaryStats } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  stats?: DiaryStats
  recentEntry?: DiaryEntry
  onClose: () => void
}

type CardType = 'record' | 'month' | 'moment'

const cardOptions: Array<{ id: CardType; label: string }> = [
  { id: 'record', label: '최근 기록' },
  { id: 'month', label: '이번 달' },
  { id: 'moment', label: '한 장의 장면' },
]

export default function ShareCard({ stats, recentEntry, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardType, setCardType] = useState<CardType>('record')
  const [isGenerating, setIsGenerating] = useState(false)
  const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date())

  const createImage = async () => {
    if (!cardRef.current) return null
    return toPng(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#fbfbfb',
    })
  }

  const downloadCard = async () => {
    setIsGenerating(true)
    try {
      const dataUrl = await createImage()
      if (!dataUrl) return
      const link = document.createElement('a')
      link.download = `curtaincall-${cardType}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast.success('이미지를 저장했습니다.')
    } catch {
      toast.error('이미지를 만들지 못했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const shareCard = async () => {
    if (!navigator.share) {
      toast.error('이 브라우저에서는 공유 기능을 지원하지 않습니다.')
      return
    }
    setIsGenerating(true)
    try {
      const dataUrl = await createImage()
      if (!dataUrl) return
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.share({
        files: [new File([blob], 'curtaincall-record.png', { type: 'image/png' })],
        title: 'CurtainCall 관극 기록',
      })
    } catch {
      toast.error('공유하지 못했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden border border-line-lightest bg-white shadow-none" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line-lightest px-5 py-4">
          <div>
            <p className="text-[10px] text-ink-lightest">Share your archive</p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-ink-base">관극 기록 카드</h2>
          </div>
          <button onClick={onClose} className="p-1 text-ink-light" aria-label="닫기"><X size={18} /></button>
        </div>

        <div className="flex gap-1 border-b border-line-lightest px-4 pt-3">
          {cardOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setCardType(option.id)}
              className={`relative flex-1 px-2 py-2.5 text-[12px] font-medium transition-colors ${
                cardType === option.id ? 'text-ink-base' : 'text-ink-lighter hover:text-ink-muted'
              }`}
            >
              {option.label}
              {cardType === option.id ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-ink-base" /> : null}
            </button>
          ))}
        </div>

        <div className="flex justify-center bg-surface-background p-6">
          {cardType === 'record' ? <RecordCard ref={cardRef} entry={recentEntry} /> : null}
          {cardType === 'month' ? <MonthCard ref={cardRef} stats={stats} monthLabel={monthLabel} /> : null}
          {cardType === 'moment' ? <MomentCard ref={cardRef} entry={recentEntry} /> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-line-lightest p-4">
          <button onClick={downloadCard} disabled={isGenerating} className="flex h-[39px] items-center justify-center gap-1 border border-line-base bg-white text-[12px] text-ink-muted">
            <Download size={15} /> 저장
          </button>
          <button onClick={shareCard} disabled={isGenerating} className="flex h-[39px] items-center justify-center gap-1 bg-brand text-[12px] font-semibold text-white">
            <Share2 size={15} /> {isGenerating ? '생성 중' : '공유'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CardFrame = forwardRef<HTMLDivElement, { children: ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="flex h-[390px] w-[280px] flex-col border border-line-base bg-surface-alt p-6 text-ink-base">
    <div className="flex items-center justify-between border-b border-line-base pb-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-ink-base">CURTAINCALL</span>
      <span className="text-[10px] text-ink-lighter">THEATRE ARCHIVE</span>
    </div>
    {children}
  </div>
))
CardFrame.displayName = 'CardFrame'

const RecordCard = forwardRef<HTMLDivElement, { entry?: DiaryEntry }>(({ entry }, ref) => (
  <CardFrame ref={ref}>
    {entry?.showPosterUrl ? (
      <img src={entry.showPosterUrl} alt="" className="mt-5 h-[158px] w-full object-cover" />
    ) : (
      <div className="mt-5 flex h-[158px] items-center justify-center bg-surface-background text-ink-lighter"><ImageIcon size={23} /></div>
    )}
    <p className="mt-5 text-[11px] font-medium text-brand">{entry?.watchedDate || '관극 기록'}</p>
    <h3 className="mt-2 line-clamp-2 text-[21px] font-semibold leading-[1.22] tracking-[-0.05em]">{entry?.showTitle || '다음 관극의 장면을 기록해 보세요.'}</h3>
    <div className="mt-auto flex items-end justify-between border-t border-line-base pt-3 text-[11px] text-ink-muted">
      <span>{entry?.theaterName || 'CurtainCall'}</span>
      {entry ? <span className="font-semibold text-ink-base">★ {entry.rating}.0</span> : null}
    </div>
  </CardFrame>
))
RecordCard.displayName = 'RecordCard'

const MonthCard = forwardRef<HTMLDivElement, { stats?: DiaryStats; monthLabel: string }>(({ stats, monthLabel }, ref) => {
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const count = stats?.monthlyCount?.[monthKey] ?? 0
  return (
    <CardFrame ref={ref}>
      <p className="mt-7 text-[12px] text-ink-muted">{monthLabel}</p>
      <h3 className="mt-2 text-[28px] font-semibold leading-[1.2] tracking-[-0.055em]">이번 달,<br />무대와 만난 날들</h3>
      <div className="mt-8 grid grid-cols-2 gap-px bg-line-base">
        <Metric label="관극" value={`${count}회`} />
        <Metric label="누적 기록" value={`${stats?.totalCount ?? 0}건`} />
        <Metric label="평균 평점" value={stats?.averageRating ? stats.averageRating.toFixed(1) : '—'} />
        <Metric label="관람 지출" value={stats?.totalSpent ? `${Math.round(stats.totalSpent / 10000)}만` : '—'} />
      </div>
      <p className="mt-auto text-[11px] leading-5 text-ink-muted">CurtainCall에서 쌓아가는<br />나만의 관극 아카이브</p>
    </CardFrame>
  )
})
MonthCard.displayName = 'MonthCard'

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-alt px-3 py-3"><p className="text-[10px] text-ink-lighter">{label}</p><p className="mt-1 text-[15px] font-semibold tracking-[-0.03em]">{value}</p></div>
}

const MomentCard = forwardRef<HTMLDivElement, { entry?: DiaryEntry }>(({ entry }, ref) => {
  const image = entry?.representativeImageUrl || entry?.photoUrls?.[0] || entry?.showPosterUrl
  return (
    <div ref={ref} className="relative h-[390px] w-[280px] overflow-hidden bg-ink-darkest text-white">
      {image ? <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-darkest via-ink-darkest/25 to-ink-darkest/20" />
      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-center justify-between text-[10px] tracking-[0.12em] text-white/75"><span>CURTAINCALL</span><span>ONE MOMENT</span></div>
        <div className="mt-auto">
          <p className="text-[11px] text-white/70">{entry?.watchedDate || '관극의 한 장면'}</p>
          <h3 className="mt-2 text-[25px] font-semibold leading-[1.22] tracking-[-0.05em]">{entry?.showTitle || '기억하고 싶은 순간'}</h3>
          {entry?.comment ? <p className="mt-4 line-clamp-3 border-l border-white/50 pl-3 text-[12px] leading-5 text-white/80">{entry.comment}</p> : null}
        </div>
      </div>
    </div>
  )
})
MomentCard.displayName = 'MomentCard'
