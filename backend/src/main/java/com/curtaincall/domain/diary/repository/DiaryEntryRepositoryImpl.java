package com.curtaincall.domain.diary.repository;

import com.curtaincall.domain.diary.dto.DiaryStatsDto;
import com.curtaincall.domain.diary.entity.QDiaryEntry;
import com.curtaincall.domain.show.entity.QShow;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.NumberTemplate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class DiaryEntryRepositoryImpl implements DiaryEntryRepositoryCustom {

        private final JPAQueryFactory queryFactory;

        @Override
        public DiaryStatsDto getStatsByUserId(Long userId) {
                QDiaryEntry diary = QDiaryEntry.diaryEntry;
                QShow show = QShow.show;

                long totalCount = Optional.ofNullable(
                                queryFactory.select(diary.count()).from(diary).where(diary.user.id.eq(userId))
                                                .fetchOne())
                                .orElse(0L);

                long totalSpent = Optional.ofNullable(
                                queryFactory.select(diary.ticketPrice.sum()).from(diary)
                                                .where(diary.user.id.eq(userId).and(diary.ticketPrice.isNotNull()))
                                                .fetchOne())
                                .orElse(0);

                Double avgRating = queryFactory.select(diary.rating.avg()).from(diary)
                                .where(diary.user.id.eq(userId)).fetchOne();

                // Top shows
                List<Tuple> topShowTuples = queryFactory
                                .select(diary.show.id, diary.show.title, diary.show.posterUrl, diary.count())
                                .from(diary)
                                .join(diary.show, show)
                                .where(diary.user.id.eq(userId))
                                .groupBy(diary.show.id, diary.show.title, diary.show.posterUrl)
                                .orderBy(diary.count().desc())
                                .limit(5)
                                .fetch();

                List<DiaryStatsDto.ShowCountDto> topShows = topShowTuples.stream()
                                .map(t -> DiaryStatsDto.ShowCountDto.builder()
                                                .showId(t.get(diary.show.id))
                                                .showTitle(t.get(diary.show.title))
                                                .posterUrl(t.get(diary.show.posterUrl))
                                                .count(Optional.ofNullable(t.get(diary.count())).orElse(0L))
                                                .build())
                                .collect(Collectors.toList());

                // Monthly count (last 12 months)
                NumberTemplate<Integer> watchedYear = Expressions.numberTemplate(Integer.class, "year({0})",
                                diary.watchedDate);
                NumberTemplate<Integer> watchedMonth = Expressions.numberTemplate(Integer.class, "month({0})",
                                diary.watchedDate);

                List<Tuple> monthlyTuples = queryFactory
                                .select(watchedYear, watchedMonth, diary.count())
                                .from(diary)
                                .where(diary.user.id.eq(userId)
                                                .and(diary.watchedDate.goe(LocalDate.now().minusMonths(12))))
                                .groupBy(watchedYear, watchedMonth)
                                .fetch();

                Map<String, Long> monthlyCount = new LinkedHashMap<>();
                monthlyTuples.forEach(t -> {
                        Integer year = t.get(watchedYear);
                        Integer month = t.get(watchedMonth);
                        if (year != null && month != null) {
                                String key = String.format("%04d-%02d", year, month);
                                monthlyCount.put(key, Optional.ofNullable(t.get(diary.count())).orElse(0L));
                        }
                });

                // Top casts from castMemo
                List<String> castMemos = queryFactory
                                .select(diary.castMemo)
                                .from(diary)
                                .where(diary.user.id.eq(userId)
                                                .and(diary.castMemo.isNotNull())
                                                .and(diary.castMemo.isNotEmpty()))
                                .fetch();

                Map<String, Long> castCount = new LinkedHashMap<>();
                for (String memo : castMemos) {
                        if (memo != null && !memo.isBlank()) {
                                for (String name : memo.split(",")) {
                                        String trimmed = name.trim();
                                        if (!trimmed.isEmpty()) {
                                                castCount.merge(trimmed, 1L, Long::sum);
                                        }
                                }
                        }
                }
                List<DiaryStatsDto.CastCountDto> topCasts = castCount.entrySet().stream()
                                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                                .limit(5)
                                .map(e -> DiaryStatsDto.CastCountDto.builder()
                                                .castName(e.getKey())
                                                .count(e.getValue())
                                                .build())
                                .collect(Collectors.toList());

                return DiaryStatsDto.builder()
                                .totalCount(totalCount)
                                .totalSpent(totalSpent)
                                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                                .topShows(topShows)
                                .topCasts(topCasts)
                                .monthlyCount(monthlyCount)
                                .build();
        }
}
