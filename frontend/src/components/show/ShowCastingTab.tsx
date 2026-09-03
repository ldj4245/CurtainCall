import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { castingApi, type CastingRole } from '../../api/casting'

interface Props {
  showId: number
  fallbackCastInfo?: string | null
}

export default function ShowCastingTab({ showId, fallbackCastInfo }: Props) {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actorSearch, setActorSearch] = useState('')

  const { data: casting, isLoading } = useQuery({
    queryKey: ['casting', showId],
    queryFn: () => castingApi.getByShow(showId),
    retry: false,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await castingApi.refresh(showId)
      await queryClient.invalidateQueries({ queryKey: ['casting', showId] })
    } catch (e) {
      console.error('캐스팅 새로고침 실패', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-gray-100 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const castingList = Array.isArray(casting) ? casting : []
  const hasCastingData = castingList.length > 0
  const fallbackList = fallbackCastInfo
    ? fallbackCastInfo.split(/[,/]+/).map((s) => s.trim()).filter(Boolean)
    : []

  const filteredCasting = hasCastingData
    ? castingList.map((role: CastingRole) => {
        const actors = Array.isArray(role?.actors) ? role.actors : []
        return {
          ...role,
          actors: actors.filter((a) =>
            (a?.name && a.name.toLowerCase().includes(actorSearch.toLowerCase())) ||
            (role?.roleName && role.roleName.toLowerCase().includes(actorSearch.toLowerCase()))
          ),
        }
      }).filter((role) => role.actors.length > 0)
    : []

  const totalActors = hasCastingData
    ? castingList.reduce((acc: number, r: CastingRole) => acc + (Array.isArray(r?.actors) ? r.actors.length : 0), 0)
    : fallbackList.length

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 pb-3 border-b border-line-base">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink-base">
            캐스팅 <span className="text-ink-lightest font-normal">{totalActors}명</span>
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 px-2 text-[11px] text-ink-light hover:text-ink-base border border-line-base flex items-center gap-1 transition-colors rounded"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? '갱신 중' : '정보 갱신'}</span>
          </button>
        </div>

        {hasCastingData && totalActors > 4 && (
          <div className="relative mt-2.5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-lightest" size={13} />
            <input
              type="text"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="배역 또는 배우 이름 검색"
              className="w-full h-8 pl-8 pr-3 text-[11px] bg-surface-alt border border-line-base focus:border-brand outline-none rounded"
            />
          </div>
        )}
      </div>

      {/* 캐스팅 목록 */}
      {hasCastingData ? (
        filteredCasting.length > 0 ? (
          <div className="space-y-4">
            {filteredCasting.map((role: CastingRole, idx: number) => (
              <div key={idx} className="border-b border-line-lightest pb-3">
                <p className="text-[12px] font-semibold text-brand mb-2">
                  {role.roleName || '출연'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {role.actors.map((actor, aIdx) => (
                    <Link
                      key={aIdx}
                      to={`/shows?keyword=${encodeURIComponent(actor.name)}`}
                      className="flex items-center gap-3 py-1.5 hover:bg-surface-alt -mx-2 px-2 transition-colors"
                    >
                      {actor.imageUrl ? (
                        <img
                          src={actor.imageUrl}
                          alt={actor.name}
                          className="w-8 h-8 rounded-full object-cover bg-surface-background border border-line-lightest"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-background border border-line-lightest flex items-center justify-center text-ink-lightest">
                          <User size={14} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-ink-darker truncate">{actor.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-[11px] text-ink-lightest">
            '{actorSearch}' 검색 결과가 없습니다.
          </p>
        )
      ) : fallbackList.length > 0 ? (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {fallbackList.map((name, i) => (
              <Link
                key={i}
                to={`/shows?keyword=${encodeURIComponent(name)}`}
                className="text-[11px] text-ink-muted px-2.5 py-1 border border-line-base hover:border-line-dark transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[11px] text-brand font-medium hover:underline"
          >
            상세 프로필 불러오기
          </button>
        </div>
      ) : (
        <p className="py-10 text-center text-[11px] text-ink-lightest">등록된 출연진 정보가 없습니다.</p>
      )}

      <p className="mt-6 pt-3 text-[10px] text-ink-lightest">
        ※ 캐스팅 일정은 변동될 수 있습니다. 출처: PlayDB / KOPIS
      </p>
    </div>
  )
}
