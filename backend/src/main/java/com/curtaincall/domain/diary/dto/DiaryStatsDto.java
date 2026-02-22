package com.curtaincall.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class DiaryStatsDto {
    private long totalCount;
    private long totalSpent;
    private double averageRating;
    private List<ShowCountDto> topShows;
    private List<CastCountDto> topCasts;
    private Map<String, Long> monthlyCount;

    @Getter
    @Builder
    public static class ShowCountDto {
        private Long showId;
        private String showTitle;
        private String posterUrl;
        private long count;
    }

    @Getter
    @Builder
    public static class CastCountDto {
        private String castName;
        private long count;
    }
}
