import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, User, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { castingApi, type CastingRole } from '../../api/casting'

interface Props { showId: number }

export default function CastingBoard({ showId }: Props) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: casting, isLoading } = useQuery({ queryKey: ['casting', showId], queryFn: () => castingApi.getByShow(showId) })
  const refresh = async () => {
    setIsRefreshing(true)
    try { await castingApi.refresh(showId); await queryClient.invalidateQueries({ queryKey: ['casting', showId] }) }
    catch (error) { console.error('캐스팅 새로고침 실패', error) }
    finally { setIsRefreshing(false) }
  }

  if (isLoading) return <div className="surface animate-pulse p-5"><div className="h-4 w-24 bg-[#eef0f3]" /><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-12 bg-[#eef0f3]" />)}</div></div>
  if (!casting?.length) return null

  const totalActors = casting.reduce((total: number, role: CastingRole) => total + role.actors.length, 0)
  return (
    <section className="surface p-5 sm:p-6">
      <header className="flex items-end justify-between border-b border-[#e5e8ee] pb-4"><div><p className="page-kicker">Casting</p><h2 className="mt-1 flex items-center gap-2 text-[19px] font-semibold tracking-[-0.04em] text-[#172033]"><Users size={17} /> 배역별 출연진 <span className="text-[13px] font-normal text-[#98a2b3]">{totalActors}명</span></h2></div><button onClick={refresh} disabled={isRefreshing} className="btn-quiet text-[12px]"><RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} /> 새로고침</button></header>
      <div className="divide-y divide-[#e5e8ee]">{casting.map((role: CastingRole, roleIndex) => <div key={`${role.roleName}-${roleIndex}`} className="py-5"><p className="meta-label mb-3">{role.roleName}</p><div className="flex flex-wrap gap-2">{role.actors.map((actor, actorIndex) => <Link key={`${actor.name}-${actorIndex}`} to={`/shows?keyword=${encodeURIComponent(actor.name)}`} className="flex items-center gap-2 border border-[#e5e8ee] bg-[#fafafb] px-2.5 py-2 transition hover:border-[#a9b1bf] hover:bg-white"><span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#eef0f3] text-[#98a2b3]">{actor.imageUrl ? <img src={actor.imageUrl} alt={actor.name} className="h-full w-full object-cover" /> : <User size={13} />}</span><span className="text-[12px] font-semibold text-[#172033]">{actor.name}</span></Link>)}</div></div>)}</div>
      <p className="mt-1 text-right text-[11px] text-[#98a2b3]">출처: PlayDB</p>
    </section>
  )
}
