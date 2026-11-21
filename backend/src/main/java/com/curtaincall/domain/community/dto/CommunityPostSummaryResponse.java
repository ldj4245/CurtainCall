package com.curtaincall.domain.community.dto;

import com.curtaincall.domain.community.entity.CommunityPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityPostSummaryResponse {

    private Long id;
    private CommunityPost.Category category;
    private String categoryDisplayName;
    private String title;
    private Long showId;
    private String showTitle;
    private Long authorId;
    private String authorNickname;
    private int viewCount;
    private int likeCount;
    private long commentCount;
    private boolean liked;
    private LocalDateTime createdAt;

    public static CommunityPostSummaryResponse from(CommunityPost post, boolean liked, long commentCount) {
        return CommunityPostSummaryResponse.builder()
                .id(post.getId())
                .category(post.getCategory())
                .categoryDisplayName(post.getCategory().getDisplayName())
                .title(post.getTitle())
                .showId(post.getShow() != null ? post.getShow().getId() : null)
                .showTitle(post.getShow() != null ? post.getShow().getTitle() : null)
                .authorId(post.getUser().getId())
                .authorNickname(post.getUser().getNickname())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(commentCount)
                .liked(liked)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
