package com.curtaincall.domain.show.repository;

import com.curtaincall.domain.show.entity.QShow;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.theater.entity.QTheater;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RequiredArgsConstructor
public class ShowRepositoryImpl implements ShowRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Show> searchShows(String keyword, Show.Genre genre, Show.Status status, String region,
            Pageable pageable) {
        QShow show = QShow.show;
        QTheater theater = QTheater.theater;

        BooleanBuilder builder = new BooleanBuilder();

        if (keyword != null && !keyword.isBlank()) {
            builder.and(show.title.containsIgnoreCase(keyword)
                    .or(show.castInfo.containsIgnoreCase(keyword)));
        }
        if (genre != null) {
            builder.and(show.genre.eq(genre));
        }
        if (status != null) {
            builder.and(show.status.eq(status));
        }
        if (region != null && !region.isBlank()) {
            builder.and(theater.region.eq(region));
        }

        NumberExpression<Integer> statusOrder = new CaseBuilder()
                .when(show.status.eq(Show.Status.ONGOING)).then(0)
                .when(show.status.eq(Show.Status.UPCOMING)).then(1)
                .otherwise(2);

        List<Show> content = queryFactory
                .selectFrom(show)
                .leftJoin(show.theater, theater).fetchJoin()
                .where(builder)
                .orderBy(statusOrder.asc(), show.startDate.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(show.count())
                .from(show)
                .leftJoin(show.theater, theater)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }
}
