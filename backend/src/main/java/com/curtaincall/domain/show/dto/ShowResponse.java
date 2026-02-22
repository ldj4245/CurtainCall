package com.curtaincall.domain.show.dto;

import com.curtaincall.domain.show.entity.Show;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Builder
public class ShowResponse {

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
    private String posterUrl;
    private String castInfo;
    private List<String> castList;
    private String priceInfo;
    private String runtime;
    private String status;
    private String statusDisplayName;
    private String ageLimit;
    private Double averageScore;
    private Long reviewCount;

    public static ShowResponse from(Show show) {
        return ShowResponse.builder()
                .id(show.getId())
                .kopisId(show.getKopisId())
                .title(show.getTitle())
                .genre(show.getGenre() != null ? show.getGenre().name() : null)
                .genreDisplayName(show.getGenre() != null ? show.getGenre().getDisplayName() : null)
                .startDate(show.getStartDate())
                .endDate(show.getEndDate())
                .theaterId(show.getTheater() != null ? show.getTheater().getId() : null)
                .theaterName(show.getTheater() != null ? show.getTheater().getName() : null)
                .theaterRegion(show.getTheater() != null ? show.getTheater().getRegion() : null)
                .posterUrl(show.getPosterUrl())
                .castInfo(show.getCastInfo())
                .castList(parseCastInfo(show.getCastInfo()))
                .priceInfo(show.getPriceInfo())
                .runtime(show.getRuntime())
                .status(show.getStatus().name())
                .statusDisplayName(show.getStatus().getDisplayName())
                .ageLimit(show.getAgeLimit())
                .build();
    }

    public static ShowResponse fromWithStats(Show show, Double averageScore, Long reviewCount) {
        ShowResponse response = from(show);
        return ShowResponse.builder()
                .id(response.id)
                .kopisId(response.kopisId)
                .title(response.title)
                .genre(response.genre)
                .genreDisplayName(response.genreDisplayName)
                .startDate(response.startDate)
                .endDate(response.endDate)
                .theaterId(response.theaterId)
                .theaterName(response.theaterName)
                .theaterRegion(response.theaterRegion)
                .posterUrl(response.posterUrl)
                .castInfo(response.castInfo)
                .castList(response.castList)
                .priceInfo(response.priceInfo)
                .runtime(response.runtime)
                .status(response.status)
                .statusDisplayName(response.statusDisplayName)
                .ageLimit(response.ageLimit)
                .averageScore(averageScore)
                .reviewCount(reviewCount)
                .build();
    }

    private static List<String> parseCastInfo(String castInfo) {
        if (castInfo == null || castInfo.isBlank())
            return Collections.emptyList();
        return Arrays.stream(castInfo.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
