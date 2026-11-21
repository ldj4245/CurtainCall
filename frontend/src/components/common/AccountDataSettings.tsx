import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import { retentionApi } from '../../api/retention'
import toast from 'react-hot-toast'
export default function AccountDataSettings() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const erase = async () => { setDeleting(true); try { await api.delete("/users/me", { data: { confirmation: confirm } }); try { await api.post("/auth/logout") } catch { /* Local credentials are cleared below. */ } useAuthStore.getState().logout(); qc.clear(); sessionStorage.clear(); navigate("/"); toast.success("탈퇴했습니다.") } catch { toast.error("탈퇴하지 못했습니다.") } finally { setDeleting(false) } }
  const [disabled, setDisabled] = useState(localStorage.getItem('analytics-disabled') === '1')
  const { data: blocks = [] } = useQuery({ queryKey: ['blocks'], queryFn: retentionApi.blocks })
  const download = async () => {
    try { const { data } = await api.get('/diary/me/export'); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'curtaincall-records.json'; a.click(); URL.revokeObjectURL(url) } catch { toast.error('기록을 내려받지 못했습니다.') }
  }
  return <div className="space-y-4 border-t border-line-base pt-4 text-sm"><div className="flex gap-5"><a href="/notifications" className="text-action">알림 설정</a><button className="text-action" onClick={() => { void download() }}>내 기록 내려받기</button></div>
    <label className="flex gap-2"><input type="checkbox" checked={disabled} onChange={e => { setDisabled(e.target.checked); localStorage.setItem('analytics-disabled', e.target.checked ? '1' : '0') }} />이 브라우저에서 이용 통계 보내지 않기</label>
    <p className="feed-meta">이용 통계에는 행동 종류와 작품 번호만 담습니다. 감상·사진·이메일은 전송하지 않습니다.</p>
    {blocks.length > 0 && <details><summary className="cursor-pointer">차단한 사용자 ({blocks.length})</summary>{blocks.map((b, i) => <p key={b.blockedUserId} className="mt-3 flex gap-4">사용자 {i + 1}<button className="text-action" onClick={() => { void retentionApi.unblock(b.blockedUserId).then(() => qc.invalidateQueries({ queryKey: ['blocks'] })).catch(() => toast.error('차단을 해제하지 못했습니다.')) }}>차단 해제</button></p>)}</details>}
    <details><summary className="cursor-pointer text-ink-muted">회원 탈퇴</summary><p className="my-3">기록·사진·일정·공개 링크와 계정 정보를 삭제합니다. 작성한 댓글·채팅은 삭제된 내용으로 표시됩니다. 신고 처리에 필요한 증거는 운영 기록으로 남습니다.</p><form onSubmit={e => { e.preventDefault(); void erase() }} className="flex flex-wrap gap-2"><input aria-label="탈퇴 확인" placeholder="탈퇴 입력" value={confirm} onChange={e => setConfirm(e.target.value)} className="border border-line-base p-2" /><button disabled={deleting || confirm !== "탈퇴"} className="button-secondary">계정 삭제</button></form></details>
  </div>
}
