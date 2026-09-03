import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, RefreshCw, Database, Sparkles, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'

export default function AdminOperationsPanel() {
  const queryClient = useQueryClient()
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000, // 30초마다 갱신
  })

  const syncStatusRankings = useMutation({
    mutationFn: () => adminApi.syncStatusRankings(),
    onMutate: () => setActiveAction('status'),
    onSuccess: (data) => {
      toast.success(data.message || '상태 및 순위 갱신 완료!')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['home-sections'] })
      queryClient.invalidateQueries({ queryKey: ['today-schedule'] })
    },
    onError: () => toast.error('상태 갱신에 실패했습니다.'),
    onSettled: () => setActiveAction(null),
  })

  const syncShows = useMutation({
    mutationFn: () => adminApi.syncShows(3),
    onMutate: () => setActiveAction('shows'),
    onSuccess: (data) => {
      toast.success(data.message || 'KOPIS 신규 공연 동기화 완료!')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['shows'] })
    },
    onError: () => toast.error('공연 동기화에 실패했습니다.'),
    onSettled: () => setActiveAction(null),
  })

  const pruneEnded = useMutation({
    mutationFn: () => adminApi.pruneEnded(30),
    onMutate: () => setActiveAction('prune'),
    onSuccess: (data) => {
      toast.success(data.message || '오래된 종료 공연이 정리되었습니다.')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['shows'] })
    },
    onError: () => toast.error('정리 작업에 실패했습니다.'),
    onSettled: () => setActiveAction(null),
  })

  return (
    <div className="mt-8 border border-ink-darkest/20 bg-gray-50/60 p-4 rounded-lg">
      <div className="flex items-center justify-between border-b border-line-lightest pb-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-amber-600" />
          <h3 className="text-[13px] font-bold text-ink-darkest">운영자 관리 센터</h3>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
            ADMIN ONLY
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink-darkest transition-colors"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      {/* 시스템 통계 요약 */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div className="rounded border border-line-lightest bg-white p-2.5">
          <p className="text-[10px] text-ink-lightest">서버 시간 (KST)</p>
          <p className="mt-1 font-semibold text-ink-darker text-[11px] truncate">
            {stats?.currentTime || '조회 중...'}
          </p>
        </div>

        <div className="rounded border border-line-lightest bg-white p-2.5">
          <p className="text-[10px] text-ink-lightest">DB 용량 방어 (5MB 제한)</p>
          <p className="mt-1 font-semibold text-emerald-700 text-[11px]">
            {stats?.estimatedDbUsageMb || '계산 중...'}
          </p>
        </div>

        <div className="rounded border border-line-lightest bg-white p-2.5">
          <p className="text-[10px] text-ink-lightest">보유 공연 현황</p>
          <p className="mt-1 font-semibold text-ink-darker text-[11px]">
            총 {stats?.totalShows || 0}편
            <span className="ml-1 text-[10px] font-normal text-ink-light">
              (진행 {stats?.ongoingShows} / 예정 {stats?.upcomingShows})
            </span>
          </p>
        </div>

        <div className="rounded border border-line-lightest bg-white p-2.5">
          <p className="text-[10px] text-ink-lightest">회원 / 다이어리</p>
          <p className="mt-1 font-semibold text-ink-darker text-[11px]">
            {stats?.totalUsers || 0}명 / {stats?.totalDiaries || 0}건
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-lightest px-1">
        <Clock size={10} />
        <span>마지막 정기 동기화: {stats?.lastSyncTime || '기록 없음'} ({stats?.lastSyncStatus || '대기중'})</span>
      </div>

      {/* 운영자 원클릭 제어 액션 */}
      <div className="mt-3.5 pt-3 border-t border-line-lightest space-y-2">
        <p className="text-[10px] font-semibold text-ink-muted">원클릭 운영 작업 실행</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          <button
            onClick={() => syncStatusRankings.mutate()}
            disabled={activeAction !== null}
            className="flex items-center justify-center gap-1.5 rounded border border-line-base bg-white py-2 text-[11px] font-medium text-ink-darker hover:border-ink-darkest hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <Sparkles size={12} className={activeAction === 'status' ? 'animate-spin text-amber-600' : 'text-amber-500'} />
            공연 상태 & 순위 즉시 갱신
          </button>

          <button
            onClick={() => syncShows.mutate()}
            disabled={activeAction !== null}
            className="flex items-center justify-center gap-1.5 rounded border border-line-base bg-white py-2 text-[11px] font-medium text-ink-darker hover:border-ink-darkest hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <Database size={12} className={activeAction === 'shows' ? 'animate-spin text-blue-600' : 'text-blue-500'} />
            KOPIS 신규 공연 동기화
          </button>

          <button
            onClick={() => pruneEnded.mutate()}
            disabled={activeAction !== null}
            className="flex items-center justify-center gap-1.5 rounded border border-rose-200 bg-white py-2 text-[11px] font-medium text-rose-700 hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-50"
          >
            <Trash2 size={12} className={activeAction === 'prune' ? 'animate-spin text-rose-600' : 'text-rose-500'} />
            30일 지난 미참조 공연 정리
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-[9.5px] text-ink-lightest leading-relaxed">
        * 매일 새벽 4시(KST)에 위 3가지 작업이 무인으로 자동 실행됩니다. 즉각적인 반영이 필요할 때만 위 버튼을 눌러주세요.
      </p>
    </div>
  )
}
