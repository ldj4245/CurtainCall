package com.curtaincall.domain.community.dto;

import com.curtaincall.domain.community.entity.CommunityPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommunityPostDetailResponse {

    private Long id;
    private CommunityPost.Category category;
    private String categoryDisplayName;
    private String title;
    private String content;
    private Long showId;
    private String showTitle;
    private String showPosterUrl;
    private Long authorId;
    private String authorNickname;
    private int viewCount;
    private int likeCount;
    private long commentCount;
    private boolean liked;
    private boolean author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommunityPostDetailResponse from(
            CommunityPost post,
            boolean liked,
            long commentCount,
            Long currentUserId) {
        return CommunityPostDetailResponse.builder()
                .id(post.getId())
                .category(post.getCategory())
                .categoryDisplayName(post.getCategory().getDisplayName())
                .title(post.getTitle())
                .content(post.getContent())
                .showId(post.getShow() != null ? post.getShow().getId() : null)
                .showTitle(post.getShow() != null ? post.getShow().getTitle() : null)
                .showPosterUrl(post.getShow() != null ? post.getShow().getPosterUrl() : null)
                .authorId(post.getUser().getId())
                .authorNickname(post.getUser().getNickname())
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(commentCount)
                .liked(liked)
                .author(currentUserId != null && currentUserId.equals(post.getUser().getId()))
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
