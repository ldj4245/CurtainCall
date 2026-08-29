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
                className="bg-white border border-gray-200 rounded-md w-full max-w-sm shadow-none animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-[13px] text-gray-600 leading-relaxed">{message}</p>
                </div>
                <div className="p-4 pt-0 flex gap-2">
                    <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 rounded-md text-[13px] h-9 px-4 bg-white inline-flex items-center justify-center">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="flex-1 bg-red-600 text-white rounded-md text-[13px] font-semibold h-9 px-4 inline-flex items-center justify-center">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
