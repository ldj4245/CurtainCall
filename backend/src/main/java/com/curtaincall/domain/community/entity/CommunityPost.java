package com.curtaincall.domain.community.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.global.common.SoftDeleteEntity;
import com.curtaincall.global.exception.BusinessException;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.Locale;

@Entity
@Table(
        name = "community_posts",
        indexes = {
                @Index(name = "idx_community_posts_created", columnList = "created_at"),
                @Index(name = "idx_community_posts_cat_created", columnList = "category, created_at"),
                @Index(name = "idx_community_posts_likes_created", columnList = "like_count, created_at"),
                @Index(name = "idx_community_posts_user_created", columnList = "user_id, created_at")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
@SQLDelete(sql = "UPDATE community_posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class CommunityPost extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id")
    private Show show;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Integer likeCount = 0;

    public void update(Category category, Show show, String title, String content) {
        this.category = category;
        this.show = show;
        this.title = title;
        this.content = content;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    @Getter
    @RequiredArgsConstructor
    public enum Category {
        FREE("자유"),
        REVIEW("후기·감상"),
        INFO("정보·꿀팁"),
        QUESTION("질문");

        private final String displayName;

        public static Category fromNullable(String value) {
            if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value.trim())) {
                return null;
            }
            try {
                return Category.valueOf(value.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw BusinessException.badRequest("지원하지 않는 카테고리입니다.");
            }
        }
    }
}
