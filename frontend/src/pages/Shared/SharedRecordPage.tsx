import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { retentionApi } from '../../api/retention'
import { track } from '../../utils/analytics'
export default function SharedRecordPage() {
  const { token = '' } = useParams()
  const { data: d, isLoading, isError } = useQuery({ queryKey: ['shared', token], queryFn: () => retentionApi.shared(token), retry: false, staleTime: 0, refetchOnMount: 'always' })
  useEffect(() => { if (d) { track('shared_record_opened', d.showId); document.title = d.showTitle + ' 관람 기록 | 커튼콜' } return () => { document.title = '커튼콜 | 공연 정보·관극 기록' } }, [d])
  return <div className="page-width max-w-3xl">
    {isLoading ? <p className="feed-notice">불러오는 중...</p> : isError || !d ? <div className="quiet-empty"><h1>공개된 기록이 없습니다.</h1><p>비공개로 바뀌거나 삭제된 기록입니다.</p><Link to="/" className="text-action">공연 보기</Link></div> : <article className="py-8">
      <h1 className="text-2xl font-semibold">{d.showTitle}</h1>
      <p className="feed-meta mt-3">{d.watchedDate} · {d.theaterName}{d.seatInfo && ` · ${d.seatInfo}`}{d.rating != null && ` · 평점 ${d.rating}`}</p>
      {d.hasSpoiler ? <details className="mt-6"><summary className="cursor-pointer text-sm">스포일러 포함 · 내용 보기</summary><Body comment={d.comment} photos={d.photoUrls} /></details> : <Body comment={d.comment} photos={d.photoUrls} />}
      <div className="mt-8 flex gap-5 border-t border-line-base pt-4"><Link className="text-action" to={`/shows/${d.showId}`}>공연 정보</Link><Link className="text-action" to="/diary?compose=1">내 기록 남기기</Link></div>
    </article>}
  </div>
}
function Body({ comment, photos }: { comment?: string; photos: string[] }) { return <><p className="mt-6 whitespace-pre-wrap leading-7">{comment}</p><div className="mt-5 space-y-3">{photos.map((p, i) => <img key={i} src={p} alt={`기록 사진 ${i + 1}`} className="max-h-[600px] w-full object-contain" />)}</div></> }
