package com.curtaincall.domain.review.dto;

import com.curtaincall.domain.review.entity.Review;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userNickname;
    private String userProfileImage;
    private Long showId;
    private String showTitle;
    private Integer storyScore;
    private Integer castScore;
    private Integer directionScore;
    private Integer soundScore;
    private Double averageScore;
    private String content;
    private Integer likeCount;
    private Boolean hasSpoiler;
    private Boolean isLiked;
    private Long commentCount;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review, Boolean isLiked, Long commentCount) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userNickname(review.getUser().getNickname())
                .userProfileImage(review.getUser().getProfileImage())
                .showId(review.getShow().getId())
                .showTitle(review.getShow().getTitle())
                .storyScore(review.getStoryScore())
                .castScore(review.getCastScore())
                .directionScore(review.getDirectionScore())
                .soundScore(review.getSoundScore())
                .averageScore(Math.round(review.getAverageScore() * 10.0) / 10.0)
                .content(review.getContent())
                .likeCount(review.getLikeCount())
                .hasSpoiler(review.getHasSpoiler())
                .isLiked(isLiked)
                .commentCount(commentCount)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
