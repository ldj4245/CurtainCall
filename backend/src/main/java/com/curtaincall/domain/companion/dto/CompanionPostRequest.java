package com.curtaincall.domain.companion.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class CompanionPostRequest {

    @NotBlank(message = "제목은 필수입니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    @FutureOrPresent(message = "관람 예정일은 과거일 수 없습니다.")
    private LocalDate performanceDate;

    @NotBlank(message = "관람 시간은 필수입니다.")
    private String performanceTime;

    @Min(value = 2, message = "모집 인원은 최소 본인 포함 2명 이상이어야 합니다.")
    private int maxMembers;

    private String seatInfo;
}
