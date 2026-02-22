package com.curtaincall.infra.kopis;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KopisShowDetailDto {
    private String kopisId;
    private String title;
    private String startDate;
    private String endDate;
    private String theaterKopisId;
    private String theaterName;
    private String genre;
    private String posterUrl;
    private String castInfo;
    private String crew;
    private String runtime;
    private String ageLimit;
    private String priceInfo;
    private String status;
    private String introImages;
}
