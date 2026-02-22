package com.curtaincall.domain.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CommentRequest {

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(max = 500, message = "댓글은 500자 이하로 작성해주세요.")
    private String content;

    private Long parentId; // null이면 최상위 댓글, 값이 있으면 대댓글
}
