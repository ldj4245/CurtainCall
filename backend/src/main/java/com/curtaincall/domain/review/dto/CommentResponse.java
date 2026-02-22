package com.curtaincall.domain.review.dto;

import com.curtaincall.domain.review.entity.ReviewComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class CommentResponse {
    private Long id;
    private Long userId;
    private String userNickname;
    private String userProfileImage;
    private String content;
    private Long parentId;
    private List<CommentResponse> replies;
    private LocalDateTime createdAt;

    public static CommentResponse from(ReviewComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userNickname(comment.getUser().getNickname())
                .userProfileImage(comment.getUser().getProfileImage())
                .content(comment.getContent())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(comment.getReplies().stream()
                        .map(CommentResponse::fromReply)
                        .collect(Collectors.toList()))
                .createdAt(comment.getCreatedAt())
                .build();
    }

    // 대댓글은 replies를 포함하지 않음 (1단계 대댓글만 지원)
    public static CommentResponse fromReply(ReviewComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userNickname(comment.getUser().getNickname())
                .userProfileImage(comment.getUser().getProfileImage())
                .content(comment.getContent())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(List.of())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
