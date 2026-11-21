package com.curtaincall.domain.community.dto;

import com.curtaincall.domain.community.entity.CommunityComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CommunityCommentResponse {

    private Long id;
    private Long authorId;
    private String authorNickname;
    private String content;
    private Long parentId;
    private List<CommunityCommentResponse> replies;
    private LocalDateTime createdAt;

    public static CommunityCommentResponse from(CommunityComment comment, List<CommunityCommentResponse> replies) {
        return CommunityCommentResponse.builder()
                .id(comment.getId())
                .authorId(comment.getUser().getId())
                .authorNickname(comment.getUser().getNickname())
                .content(comment.getContent())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .replies(replies)
                .createdAt(comment.getCreatedAt())
                .build();
    }

    public static CommunityCommentResponse fromReply(CommunityComment reply) {
        return from(reply, List.of());
    }
}
