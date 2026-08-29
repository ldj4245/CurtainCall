import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar } from 'lucide-react';
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
                        <div className="w-6 h-6 bg-surface-alt rounded-sm"></div>
                        <div className="h-6 bg-surface-alt rounded-sm w-1/3"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[200px] bg-surface-alt border border-line-lightest rounded-sm" />
                    ))}
                </div>
            </section>
        );
    }

    const posts = data?.content || [];

    if (posts.length === 0) return null;

    return (
        <section className="mb-14">
            <div className="mb-4 flex items-end justify-between border-b border-line-dark pb-4">
                <div>
                    <h2 className="text-[25px] font-semibold tracking-[-0.06em] text-ink-darker flex items-center gap-2">
                        최근 모집 중인 동행
                    </h2>
                    <p className="mt-1 text-[11px] text-ink-lighter">
                        같이 보면 더 즐거운 관극 생활
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <article
                        key={post.id}
                        onClick={() => navigate(`/shows/${post.showId}`)}
                        className="border border-line-lighter bg-surface-base p-4 cursor-pointer hover:border-line-dark transition-colors group flex flex-col h-full rounded-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-brand border border-line-lighter">
                                모집 중
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                                <Users size={11} />
                                <span>{post.currentMembers} / {post.maxMembers}</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-[10px] font-semibold text-ink-lighter mb-1 line-clamp-1">{post.showTitle}</p>
                            <h3 className="text-[13px] font-semibold text-ink-darker mb-2 line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-[11px] text-ink-muted line-clamp-2 mb-4 leading-5">
                                {post.content}
                            </p>
                        </div>

                        <div className="space-y-1 pt-3 border-t border-line-lightest mt-auto">
                            <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                                <Calendar size={11} className="text-ink-lighter" />
                                <span>{format(parseISO(post.performanceDate), 'M월 d일(E)', { locale: ko })} {post.performanceTime}</span>
                            </div>
                            {post.seatInfo && (
                                <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                                    <MapPin size={11} className="text-ink-lighter" />
                                    <span className="line-clamp-1">{post.seatInfo}</span>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
