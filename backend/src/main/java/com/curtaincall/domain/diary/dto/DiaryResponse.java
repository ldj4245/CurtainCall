package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.diary.entity.DiaryEntry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class DiaryResponse {
    private Long id;
    private Long showId;
    private String showTitle;
    private String showPosterUrl;
    private String theaterName;
    private LocalDate watchedDate;
    private String seatInfo;
    private String castMemo;
    private Integer rating;
    private String comment;
    private Integer ticketPrice;
    private Boolean isOpen;
    private LocalDateTime createdAt;

    public static DiaryResponse from(DiaryEntry entry) {
        return DiaryResponse.builder()
                .id(entry.getId())
                .showId(entry.getShow().getId())
                .showTitle(entry.getShow().getTitle())
                .showPosterUrl(entry.getShow().getPosterUrl())
                .theaterName(entry.getShow().getTheater() != null ? entry.getShow().getTheater().getName() : null)
                .watchedDate(entry.getWatchedDate())
                .seatInfo(entry.getSeatInfo())
                .castMemo(entry.getCastMemo())
                .rating(entry.getRating())
                .comment(entry.getComment())
                .ticketPrice(entry.getTicketPrice())
                .isOpen(entry.getIsOpen())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
