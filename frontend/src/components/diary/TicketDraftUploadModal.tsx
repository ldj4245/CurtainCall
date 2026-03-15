import { useRef, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ImagePlus, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { TicketDraftResponse } from '../../types'

interface Props {
  onClose: () => void
  onDraftReady: (draft: TicketDraftResponse) => void
}

export default function TicketDraftUploadModal({ onClose, onDraftReady }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: (file: File) => diaryApi.createTicketDraft(file),
    onSuccess: (draft) => {
      onDraftReady(draft)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        '티켓 이미지를 읽지 못했습니다. 다른 이미지로 다시 시도해 주세요.'
      toast.error(message)
    },
  })

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    mutation.mutate(file)
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-card-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">티켓으로 기록 시작</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              예매 확인 화면이나 모바일 티켓 캡처를 올리면 날짜와 좌석 정보를 먼저 채워드립니다.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={mutation.isPending}
            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-warm-50 px-6 py-10 text-center transition-colors hover:border-brand/40 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isPending ? <Loader2 size={28} className="animate-spin text-brand" /> : <ImagePlus size={28} className="text-brand" />}
            <p className="mt-4 text-base font-semibold text-gray-900">
              {mutation.isPending ? '이미지를 읽고 있습니다' : '티켓 이미지 선택'}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              한 장만 올릴 수 있습니다. 글자가 잘 보이는 캡처일수록 정확도가 높습니다.
            </p>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleSelect}
          />

          <p className="mt-4 text-xs leading-5 text-gray-400">
            업로드한 티켓 이미지는 초안 생성에만 사용하고 저장하지 않습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
