package com.curtaincall.domain.community.dto;

import com.curtaincall.domain.community.entity.CommunityPost;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommunityPostRequest {

    @NotNull(message = "카테고리를 선택해주세요.")
    private CommunityPost.Category category;

    private Long showId;

    @NotBlank(message = "제목을 입력해주세요.")
    @Size(min = 2, max = 120, message = "제목은 2자 이상 120자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    @Size(min = 2, max = 5000, message = "내용은 2자 이상 5000자 이하로 입력해주세요.")
    private String content;
}
