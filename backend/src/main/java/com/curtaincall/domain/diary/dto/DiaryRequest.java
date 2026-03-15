package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.diary.entity.DiaryEntrySource;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
public class DiaryRequest {

    @NotNull(message = "공연 ID는 필수입니다.")
    private Long showId;

    @NotNull(message = "관람 날짜는 필수입니다.")
    @PastOrPresent(message = "관람 날짜는 오늘 이전이어야 합니다.")
    private LocalDate watchedDate;

    @Size(max = 100, message = "좌석 정보는 100자 이내로 입력해주세요.")
    private String seatInfo;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime performanceTime;

    @Size(max = 500, message = "캐스트 메모는 500자 이내로 입력해주세요.")
    private String castMemo;

    @NotNull(message = "평점은 필수입니다.")
    @Min(value = 1, message = "평점은 1 이상이어야 합니다.")
    @Max(value = 5, message = "평점은 5 이하이어야 합니다.")
    private Integer rating;

    private String comment;

    @Min(value = 0, message = "티켓 가격은 0 이상이어야 합니다.")
    private Integer ticketPrice;

    @Min(value = 1, message = "시야 만족도는 1 이상이어야 합니다.")
    @Max(value = 5, message = "시야 만족도는 5 이하여야 합니다.")
    private Integer viewRating;

    private Boolean isOpen = false;

    private DiaryEntrySource entrySource = DiaryEntrySource.MANUAL;

    @Size(max = 5, message = "사진은 최대 5장까지 첨부할 수 있습니다.")
    private List<String> photoUrls;
}
