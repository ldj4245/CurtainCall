package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.diary.entity.DiaryEntry;
import com.curtaincall.domain.diary.entity.DiaryEntrySource;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

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
    @JsonFormat(pattern = "HH:mm")
    private LocalTime performanceTime;
    private String castMemo;
    private Integer rating;
    private String comment;
    private Integer ticketPrice;
    private Integer viewRating;
    private Boolean isOpen;
    private DiaryEntrySource entrySource;
    private List<String> photoUrls;
    private String representativeImageUrl;
    private LocalDateTime createdAt;

    public static DiaryResponse from(DiaryEntry entry) {
        List<String> photos = parsePhotoUrls(entry.getPhotoUrls());
        String representativeImage = photos.isEmpty()
                ? entry.getShow().getPosterUrl()
                : photos.get(0);

        return DiaryResponse.builder()
                .id(entry.getId())
                .showId(entry.getShow().getId())
                .showTitle(entry.getShow().getTitle())
                .showPosterUrl(entry.getShow().getPosterUrl())
                .theaterName(entry.getShow().getTheater() != null ? entry.getShow().getTheater().getName() : null)
                .watchedDate(entry.getWatchedDate())
                .seatInfo(entry.getSeatInfo())
                .performanceTime(entry.getPerformanceTime())
                .castMemo(entry.getCastMemo())
                .rating(entry.getRating())
                .comment(entry.getComment())
                .ticketPrice(entry.getTicketPrice())
                .viewRating(entry.getViewRating())
                .isOpen(entry.getIsOpen())
                .entrySource(entry.getEntrySource())
                .photoUrls(photos)
                .representativeImageUrl(representativeImage)
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private static List<String> parsePhotoUrls(String photoUrls) {
        if (photoUrls == null || photoUrls.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(photoUrls.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
