package com.curtaincall.domain.diary.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class DiaryRequest {

    @NotNull(message = "공연 ID는 필수입니다.")
    private Long showId;

    @NotNull(message = "관람 날짜는 필수입니다.")
    @PastOrPresent(message = "관람 날짜는 오늘 이전이어야 합니다.")
    private LocalDate watchedDate;

    @Size(max = 100, message = "좌석 정보는 100자 이내로 입력해주세요.")
    private String seatInfo;

    @Size(max = 500, message = "캐스트 메모는 500자 이내로 입력해주세요.")
    private String castMemo;

    @NotNull(message = "평점은 필수입니다.")
    @Min(value = 1, message = "평점은 1 이상이어야 합니다.")
    @Max(value = 5, message = "평점은 5 이하이어야 합니다.")
    private Integer rating;

    private String comment;

    @Min(value = 0, message = "티켓 가격은 0 이상이어야 합니다.")
    private Integer ticketPrice;

    private Boolean isOpen = false;
}
