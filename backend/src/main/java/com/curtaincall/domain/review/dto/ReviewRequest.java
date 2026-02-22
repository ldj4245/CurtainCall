package com.curtaincall.domain.review.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;

@Getter
public class ReviewRequest {

    @NotNull @Min(1) @Max(5)
    private Integer storyScore;

    @NotNull @Min(1) @Max(5)
    private Integer castScore;

    @NotNull @Min(1) @Max(5)
    private Integer directionScore;

    @NotNull @Min(1) @Max(5)
    private Integer soundScore;

    @NotBlank(message = "리뷰 내용은 필수입니다.")
    @Size(min = 10, max = 2000, message = "리뷰는 10자 이상 2000자 이하로 작성해주세요.")
    private String content;

    private Boolean hasSpoiler = false;
}
