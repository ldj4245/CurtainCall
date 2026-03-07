import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, HeartHandshake } from 'lucide-react';
import { companionApi } from '../../api/companion';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function RecentCompanions() {
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['recent-companions'],
        queryFn: () => companionApi.getRecentCompanions(),
    });

    if (isLoading || !data) {
        return (
            <section className="mb-14 animate-pulse">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-warm-100 rounded-lg"></div>
                        <div className="h-7 bg-warm-100 rounded-lg w-1/3"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[200px] bg-warm-100 rounded-2xl" />
                    ))}
                </div>
            </section>
        );
    }

    const posts = data?.content || [];

    if (posts.length === 0) return null; // 글이 없으면 홈 화면에 노출하지 않음

    return (
        <section className="mb-14">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <HeartHandshake className="w-6 h-6 text-brand" />
                        지금 뜨는 동행 구하기
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        같이 보면 더 즐거운 관극 생활! 좋은 자리를 함께할 동행을 찾아보세요.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        onClick={() => navigate(`/shows/${post.showId}`)}
                        className="card p-5 cursor-pointer hover:shadow-card-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full border border-gray-100/50"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-full bg-brand-50 text-brand border border-brand-100">
                                모집 중
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                <Users size={12} />
                                <span>{post.currentMembers} / {post.maxMembers}명</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-xs font-semibold text-brand mb-1 line-clamp-1">{post.showTitle}</p>
                            <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                                {post.title}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                {post.content}
                            </p>
                        </div>

                        <div className="space-y-1.5 pt-4 border-t border-gray-100 mt-auto">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{format(parseISO(post.performanceDate), 'M월 d일(E)', { locale: ko })} {post.performanceTime}</span>
                            </div>
                            {post.seatInfo && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <MapPin size={13} className="text-gray-400" />
                                    <span className="line-clamp-1">{post.seatInfo}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
