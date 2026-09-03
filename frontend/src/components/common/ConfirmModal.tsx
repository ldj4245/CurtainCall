import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'brand'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'brand'
      ? 'bg-brand hover:bg-brand/90 text-white'
      : 'bg-ink-darkest hover:bg-black text-white'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-white border border-line-base rounded-md w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-lightest">
          <h2 className="text-[15px] font-semibold text-ink-darkest">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 text-ink-lightest hover:text-ink-dark transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13px] text-ink-muted leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        <div className="px-5 pb-5 pt-1 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-9 border border-line-base text-ink-muted rounded-md text-[13px] font-medium bg-white hover:bg-surface-alt transition-colors inline-flex items-center justify-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-9 rounded-md text-[13px] font-semibold transition-colors inline-flex items-center justify-center ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
