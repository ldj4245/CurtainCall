package com.curtaincall.domain.review.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
@SQLDelete(sql = "UPDATE reviews SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Review extends com.curtaincall.global.common.SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "story_score", nullable = false)
    private Integer storyScore;

    @Column(name = "cast_score", nullable = false)
    private Integer castScore;

    @Column(name = "direction_score", nullable = false)
    private Integer directionScore;

    @Column(name = "sound_score", nullable = false)
    private Integer soundScore;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "has_spoiler", nullable = false)
    @Builder.Default
    private Boolean hasSpoiler = false;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReviewComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReviewLike> likes = new ArrayList<>();

    public double getAverageScore() {
        return (storyScore + castScore + directionScore + soundScore) / 4.0;
    }

    public void update(Integer storyScore, Integer castScore, Integer directionScore,
            Integer soundScore, String content, Boolean hasSpoiler) {
        this.storyScore = storyScore;
        this.castScore = castScore;
        this.directionScore = directionScore;
        this.soundScore = soundScore;
        this.content = content;
        this.hasSpoiler = hasSpoiler;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0)
            this.likeCount--;
    }
}
