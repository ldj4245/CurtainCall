package com.curtaincall.domain.community.repository;

import com.curtaincall.domain.community.entity.CommunityPost;
import com.curtaincall.domain.community.entity.QCommunityPost;
import com.curtaincall.domain.show.entity.QShow;
import com.curtaincall.domain.user.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RequiredArgsConstructor
public class CommunityPostRepositoryImpl implements CommunityPostRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<CommunityPost> searchPosts(
            CommunityPost.Category category,
            Long showId,
            String keyword,
            String sort,
            Pageable pageable) {
        QCommunityPost post = QCommunityPost.communityPost;
        QUser user = QUser.user;
        QShow show = QShow.show;

        BooleanBuilder builder = new BooleanBuilder();
        if (category != null) {
            builder.and(post.category.eq(category));
        }
        if (showId != null) {
            builder.and(post.show.id.eq(showId));
        }
        if (keyword != null && !keyword.isBlank()) {
            String trimmed = keyword.trim();
            builder.and(
                    post.title.containsIgnoreCase(trimmed)
                            .or(post.content.containsIgnoreCase(trimmed))
                            .or(show.title.containsIgnoreCase(trimmed))
            );
        }

        OrderSpecifier<?>[] orderSpecifiers = "likes".equalsIgnoreCase(sort)
                ? new OrderSpecifier<?>[] { post.likeCount.desc(), post.createdAt.desc(), post.id.desc() }
                : new OrderSpecifier<?>[] { post.createdAt.desc(), post.id.desc() };

        List<CommunityPost> content = queryFactory
                .selectFrom(post)
                .join(post.user, user).fetchJoin()
                .leftJoin(post.show, show).fetchJoin()
                .where(builder)
                .orderBy(orderSpecifiers)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(post.count())
                .from(post)
                .leftJoin(post.show, show)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }
}
