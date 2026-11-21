package com.curtaincall.domain.show.dto;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.theater.RegionNormalizer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Builder(toBuilder = true)
public class ShowResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private java.time.LocalDateTime sourceUpdatedAt;
    private Long id;
    private String kopisId;
    private String title;
    private String genre;
    private String genreDisplayName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long theaterId;
    private String theaterName;
    private String theaterRegion;
    private String theaterAddress;
    private Integer theaterSeatScale;
    private String posterUrl;
    private String castInfo;
    private List<String> castList;
    private String priceInfo;
    private String runtime;
    private String dtguidance;
    private List<BookingLinkItem> bookingLinks;
    private String status;
    private String statusDisplayName;
    private String ageLimit;
    private List<String> introImages;
    private Double averageScore;
    private Long reviewCount;
    private Long ratingCount;

    public ShowResponse withRatingCount(long count) { this.ratingCount = count; return this; }
    private Long diaryCount;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingLinkItem {
        private String name;
        private String url;
    }

    public static ShowResponse from(Show show) {
        return ShowResponse.builder()
                .sourceUpdatedAt(show.getUpdatedAt())
                .id(show.getId())
                .kopisId(show.getKopisId())
                .title(show.getTitle())
                .genre(show.getGenre() != null ? show.getGenre().name() : null)
                .genreDisplayName(show.getGenre() != null ? show.getGenre().getDisplayName() : null)
                .startDate(show.getStartDate())
                .endDate(show.getEndDate())
                .theaterId(show.getTheater() != null ? show.getTheater().getId() : null)
                .theaterName(show.getTheater() != null ? cleanBlank(show.getTheater().getName()) : null)
                .theaterRegion(show.getTheater() != null
                        ? RegionNormalizer.normalize(show.getTheater().getRegion(), show.getTheater().getAddress())
                        : null)
                .theaterAddress(show.getTheater() != null ? cleanBlank(show.getTheater().getAddress()) : null)
                .theaterSeatScale(show.getTheater() != null ? show.getTheater().getSeatScale() : null)
                .posterUrl(cleanBlank(show.getPosterUrl()))
                .castInfo(cleanBlank(show.getCastInfo()))
                .castList(parseCastInfo(show.getCastInfo()))
                .priceInfo(cleanBlank(show.getPriceInfo()))
                .runtime(cleanBlank(show.getRuntime()))
                .dtguidance(cleanBlank(show.getDtguidance()))
                .bookingLinks(parseBookingLinks(show.getBookingLinks()))
                .status(show.getStatus().name())
                .statusDisplayName(show.getStatus().getDisplayName())
                .ageLimit(cleanBlank(show.getAgeLimit()))
                .introImages(parseIntroImages(show.getIntroImages()))
                .diaryCount(null)
                .build();
    }

    public static ShowResponse fromWithStats(Show show, Double averageScore, Long reviewCount) {
        return from(show).toBuilder()
                .averageScore(averageScore)
                .reviewCount(reviewCount)
                .build();
    }

    public static ShowResponse fromWithDiaryCount(Show show, Long diaryCount) {
        return from(show).toBuilder()
                .diaryCount(diaryCount)
                .build();
    }

    private static String cleanBlank(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static List<String> parseCastInfo(String castInfo) {
        if (castInfo == null || castInfo.isBlank())
            return Collections.emptyList();
        return Arrays.stream(castInfo.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private static List<String> parseIntroImages(String introImages) {
        if (introImages == null || introImages.isBlank())
            return Collections.emptyList();
        return Arrays.stream(introImages.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private static List<BookingLinkItem> parseBookingLinks(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(rawJson, new TypeReference<List<BookingLinkItem>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
