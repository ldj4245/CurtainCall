import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, User, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { castingApi, type CastingRole } from '../../api/casting'

interface Props {
    showId: number
}

export default function CastingBoard({ showId }: Props) {
    const queryClient = useQueryClient()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { data: casting, isLoading } = useQuery({
        queryKey: ['casting', showId],
        queryFn: () => castingApi.getByShow(showId),
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
            <div className="card p-6 animate-pulse space-y-4">
                <div className="h-6 bg-warm-100 rounded w-1/4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-warm-100 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (!casting || casting.length === 0) return null

    return (
        <div className="card p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
                <h2 className="section-title flex items-center gap-2 mb-0">
                    <Users size={20} className="text-brand" />
                    배역별 출연진
                    <span className="text-gray-400 text-base font-normal">
                        ({casting.reduce((acc: number, r: CastingRole) => acc + r.actors.length, 0)}명)
                    </span>
                </h2>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-xs text-gray-400 hover:text-brand transition-colors flex items-center gap-1"
                    title="캐스팅 정보 새로고침"
                >
                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                    새로고침
                </button>
            </div>

            <div className="space-y-5">
                {casting.map((role: CastingRole, idx: number) => (
                    <div key={idx}>
                        <p className="text-sm font-semibold text-gray-500 mb-2.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                            {role.roleName}
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {role.actors.map((actor, aIdx) => (
                                <div
                                    key={aIdx}
                                    className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-warm-50 
                             px-3.5 py-2.5 hover:border-brand-200 hover:bg-brand-50 transition-all"
                                >
                                    {actor.imageUrl ? (
                                        <img
                                            src={actor.imageUrl}
                                            alt={actor.name}
                                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                            <User size={16} />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-800">{actor.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-4 text-xs text-gray-300 text-right">
                출처: PlayDB
            </p>
        </div>
    )
}
