import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { retentionApi } from '../../api/retention'
import type { DiaryEntry, DiaryStats } from '../../types'
interface Props { stats?: DiaryStats; recentEntry?: DiaryEntry; onClose: () => void; initialMonth?: string }
export default function ShareCard({ recentEntry, onClose, initialMonth }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [month, setMonth] = useState(initialMonth ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
  const [mode, setMode] = useState<'month' | 'record'>('month')
  const [price, setPrice] = useState(false)
  const [rating, setRating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [year, monthNumber] = month.split('-').map(Number)
  const { data, isLoading, isError } = useQuery({ queryKey: ['diary', 'month', year, monthNumber], queryFn: () => retentionApi.month(year, monthNumber), enabled: !!year && !!monthNumber })
  const entries = mode === 'month' ? data?.entries ?? [] : recentEntry ? [recentEntry] : []
  const generate = async (share: boolean) => {
    if (!cardRef.current || isLoading || isError) return
    setBusy(true)
    try {
      await Promise.all(Array.from(cardRef.current.querySelectorAll('img')).map(img => img.decode().catch(() => {})))
      const image = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#fff', cacheBust: false, skipFonts: true, style: { margin: '0', fontFamily: 'Arial, Malgun Gothic, sans-serif' } })
      const blob = await (await fetch(image)).blob()
      const file = new File([blob], 'curtaincall.png', { type: 'image/png' })
      if (share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: '커튼콜 관람 기록' })
      else { const a = document.createElement('a'); a.href = image; a.download = `curtaincall-${month}.png`; a.click(); toast.success('이미지를 저장했습니다.') }
    } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) toast.error('이미지를 만들지 못했습니다. 포스터 제공처의 이미지 접근 제한일 수 있습니다.') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="공유 카드" className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-line-base bg-white p-5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between"><h2 className="font-semibold">공유 카드</h2><button onClick={onClose} className="text-action">닫기</button></div>
      <div className="my-4 flex flex-wrap gap-3 text-sm"><select aria-label="카드 종류" value={mode} onChange={e => setMode(e.target.value as 'month' | 'record')} className="border p-1"><option value="month">월간 기록</option><option value="record">최근 기록</option></select>{mode === 'month' && <input aria-label="공유할 월" type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value) }} className="border p-1" />}</div>
      <div className="mb-4 flex gap-5 text-sm"><label><input type="checkbox" checked={price} onChange={e => setPrice(e.target.checked)} /> 지출 포함</label><label><input type="checkbox" checked={rating} onChange={e => setRating(e.target.checked)} /> 평점 포함</label></div>
      <p className="feed-meta mb-3">이미지에는 비공개 기록의 작품명도 포함됩니다. 아래 미리보기를 확인해 주세요.</p>
      {isError ? <p role="alert">월간 기록을 불러오지 못했습니다.</p> : <div ref={cardRef} className="mx-auto w-[300px] border border-line-base bg-white p-5 text-ink-base">
        <p className="text-sm font-semibold">{mode === 'month' ? month + ' 관람 기록' : '관람 기록'}</p>
        <p className="my-3 text-2xl font-semibold">{mode === 'month' ? data?.count ?? '…' : entries.length}회</p>
        <div className="grid grid-cols-3 gap-2">{entries.slice(0, 12).map(e => <div key={e.id}>{e.showPosterUrl && !e.showPosterUrl.endsWith('/curtain.svg') ? <img crossOrigin="anonymous" src={e.showPosterUrl} alt="" className="aspect-[2/3] w-full object-cover" /> : <div className="aspect-[2/3] border border-line-base bg-surface-alt" />}<p className="mt-1 text-[10px] leading-4 line-clamp-2">{e.showTitle}</p></div>)}</div>
        {entries.length > 12 && <p className="mt-2 text-xs">외 {entries.length - 12}회</p>}
        {price && <p className="mt-3 text-sm">지출 {(mode === 'month' ? data?.totalSpent ?? 0 : recentEntry?.ticketPrice ?? 0).toLocaleString()}원</p>}
        {rating && <p className="mt-2 text-sm">평균 평점 {mode === 'month' ? data?.averageRating ? data.averageRating.toFixed(1) : '미입력' : recentEntry?.rating ?? '미입력'}</p>}
        <p className="mt-5 border-t border-line-base pt-3 text-[10px] text-ink-muted">커튼콜 · {location.host}</p>
      </div>}
      <div className="mt-5 flex justify-end gap-2"><button disabled={busy || isLoading || isError} onClick={() => { void generate(false) }} className="button-secondary">이미지 저장</button><button disabled={busy || isLoading || isError} onClick={() => { void generate(true) }} className="button-primary">{busy ? '생성 중…' : '공유'}</button></div>
    </div>
  </div>
}
