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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/45 p-4">
            <div className="w-full max-w-lg overflow-hidden border border-[#e5e8ee] bg-white shadow-[0_18px_50px_rgba(23,32,51,0.18)]">
                <div className="flex items-center justify-between border-b border-[#e5e8ee] px-5 py-4">
                    <div><p className="page-kicker">Find a companion</p><h2 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#172033]">동행 모집</h2></div>
                    <button onClick={onClose} className="icon-button" aria-label="동행 모집 닫기">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-[#536076]">제목</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="예: 이번 주 토요일 함께 관람하실 분"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#536076]">
                                <Calendar size={13} className="text-[#8993a4]" />
                                관람일
                            </label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.performanceDate}
                                onChange={(e) => setFormData({ ...formData, performanceDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#536076]">
                                <Clock size={13} className="text-[#8993a4]" />
                                관람 시간
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="예: 14:00"
                                value={formData.performanceTime}
                                onChange={(e) => setFormData({ ...formData, performanceTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#536076]">
                                <Users size={13} className="text-[#8993a4]" />
                                모집 인원 (본인 포함)
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                min={2}
                                max={10}
                                value={formData.maxMembers}
                                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 2 })}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#536076]">
                                <MapPin size={13} className="text-[#8993a4]" />
                                좌석 정보 (선택)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="예: 1층 VIP석 연석"
                                value={formData.seatInfo}
                                onChange={(e) => setFormData({ ...formData, seatInfo: e.target.value })}
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-[#536076]">상세 내용</label>
                        <textarea
                            className="min-h-[112px] w-full resize-none rounded-md border border-[#d9dee7] bg-[#fafafb] px-3.5 py-3 text-[13px] leading-6 text-[#172033] placeholder:text-[#98a2b3] focus:border-[#aeb7c5] focus:bg-white focus:outline-none"
                            placeholder="만날 장소, 시간 등 동행에게 필요한 내용을 적어 주세요."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 border-t border-[#e5e8ee] pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary flex-1"
                        >
                            {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : '등록하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
