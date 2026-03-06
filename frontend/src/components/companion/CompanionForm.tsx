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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">동행 모집하기</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">제목</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="예: 이번주 토요일 데스노트 같이 보실 분!"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                <Calendar size={14} className="text-gray-400" />
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
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                <Clock size={14} className="text-gray-400" />
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                <Users size={14} className="text-gray-400" />
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
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">상세 내용</label>
                        <textarea
                            className="input-field min-h-[120px] resize-none"
                            placeholder="만날 장소, 시간, 관람 후 뒷풀이 여부 등 상세한 내용을 적어주세요."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold bg-white hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-600 transition-colors flex justify-center items-center"
                        >
                            {createMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : '등록하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
