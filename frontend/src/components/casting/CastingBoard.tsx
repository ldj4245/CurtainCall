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
    <section className="border border-line-base bg-white p-5 sm:p-6 rounded-md">
      <header className="flex items-end justify-between border-b border-line-lightest pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-ink-darkest">
            <Users size={16} className="text-ink-lighter" /> 배역별 출연진{' '}
            <span className="text-[12px] font-normal text-ink-lightest">({totalActors}명)</span>
          </h2>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 border border-line-base text-ink-muted rounded text-[11px] font-medium hover:bg-surface-alt transition-colors inline-flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-brand' : ''} />
          새로고침
        </button>
      </header>
      <div className="divide-y divide-line-lightest">
        {casting.map((role: CastingRole, roleIndex) => (
          <div key={`${role.roleName}-${roleIndex}`} className="py-4">
            <p className="text-[11px] font-semibold text-ink-muted mb-2.5">{role.roleName}</p>
            <div className="flex flex-wrap gap-2">
              {role.actors.map((actor, actorIndex) => (
                <Link
                  key={`${actor.name}-${actorIndex}`}
                  to={`/shows?keyword=${encodeURIComponent(actor.name)}`}
                  className="flex items-center gap-2 border border-line-base bg-surface-base px-2.5 py-1.5 rounded transition hover:border-ink-darkest hover:bg-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-ink-lightest">
                    {actor.imageUrl ? (
                      <img src={actor.imageUrl} alt={actor.name} className="h-full w-full object-cover" />
                    ) : (
                      <User size={12} />
                    )}
                  </span>
                  <span className="text-[12px] font-medium text-ink-darkest">{actor.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-right text-[10px] text-ink-lightest">출처: PlayDB</p>
    </section>
  )
}
