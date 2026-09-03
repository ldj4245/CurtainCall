import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { companionApi, CompanionPostRequest } from '../../api/companion';

interface CompanionFormProps {
    showId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompanionForm({ showId, onClose, onSuccess }: CompanionFormProps) {
    const [formData, setFormData] = useState<CompanionPostRequest>({
        title: '',
        content: '',
        performanceDate: '',
        performanceTime: '',
        maxMembers: 2,
        seatInfo: ''
    });

    const createMutation = useMutation({
        mutationFn: (data: CompanionPostRequest) => companionApi.createCompanion(showId, data),
        onSuccess: () => {
            toast.success('동행 모집글이 등록되었습니다!');
            onSuccess();
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || '등록에 실패했습니다.';
            toast.error(msg);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('제목을 입력해주세요.');
        if (!formData.content.trim()) return toast.error('내용을 입력해주세요.');
        if (!formData.performanceDate) return toast.error('관람 예정일을 선택해주세요.');
        if (!formData.performanceTime) return toast.error('관람 시간을 입력해주세요.');
        if (formData.maxMembers < 2) return toast.error('모집 인원은 최소 2명이어야 합니다.');

        createMutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg border border-line-base bg-white rounded-md shadow-2xl flex flex-col max-h-[88vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-line-lightest px-5 py-4">
                    <div>
                        <h2 className="text-[17px] font-semibold tracking-tight text-ink-darkest">동행 모집글 작성</h2>
                        <p className="text-[11px] text-ink-muted mt-0.5">함께 관람할 동행을 모집합니다.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-ink-lightest hover:text-ink-dark transition-colors"
                        aria-label="동행 모집 닫기"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5 overflow-y-auto flex-1">
                    <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">제목</label>
                        <input
                            type="text"
                            className="w-full h-10 px-3 border border-line-base bg-surface-base rounded-md text-[13px] text-ink-base placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                            placeholder="예: 이번 주 토요일 낮공 함께 관람하실 분"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-ink-muted">
                                <Calendar size={13} className="text-ink-lightest" />
                                관람일
                            </label>
                            <input
                                type="date"
                                className="w-full h-10 px-3 border border-line-base bg-surface-base rounded-md text-[13px] text-ink-base focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                                value={formData.performanceDate}
                                onChange={(e) => setFormData({ ...formData, performanceDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-ink-muted">
                                <Clock size={13} className="text-ink-lightest" />
                                관람 시간
                            </label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 border border-line-base bg-surface-base rounded-md text-[13px] text-ink-base placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                                placeholder="예: 14:00"
                                value={formData.performanceTime}
                                onChange={(e) => setFormData({ ...formData, performanceTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-ink-muted">
                                <Users size={13} className="text-ink-lightest" />
                                모집 인원 (본인 포함)
                            </label>
                            <input
                                type="number"
                                className="w-full h-10 px-3 border border-line-base bg-surface-base rounded-md text-[13px] text-ink-base focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                                min={2}
                                max={10}
                                value={formData.maxMembers}
                                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 2 })}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-ink-muted">
                                <MapPin size={13} className="text-ink-lightest" />
                                좌석 정보 (선택)
                            </label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 border border-line-base bg-surface-base rounded-md text-[13px] text-ink-base placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                                placeholder="예: 1층 B구역 8열"
                                value={formData.seatInfo}
                                onChange={(e) => setFormData({ ...formData, seatInfo: e.target.value })}
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-ink-muted">상세 내용</label>
                        <textarea
                            className="min-h-[110px] w-full resize-none rounded-md border border-line-base bg-surface-base px-3.5 py-3 text-[13px] leading-6 text-ink-base placeholder:text-ink-lighter focus:border-ink-darkest focus:bg-white focus:outline-none transition-colors"
                            placeholder="만날 장소, 시간, 티켓 보유 여부 등 동행에게 필요한 내용을 적어 주세요."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 border-t border-line-lightest pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 border border-line-base text-ink-muted rounded-md text-[13px] font-medium bg-white hover:bg-surface-alt transition-colors inline-flex items-center justify-center"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 h-10 bg-brand text-white rounded-md text-[13px] font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                        >
                            {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : '모집글 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
