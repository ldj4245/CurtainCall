import { X } from 'lucide-react'

interface ConfirmModalProps {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({
    title,
    message,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-card-lg animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onCancel} className="flex-1 btn-secondary py-2.5">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="flex-1 btn-primary py-2.5 bg-red-500 hover:bg-red-600 border-red-500">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
