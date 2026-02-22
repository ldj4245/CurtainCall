package com.curtaincall.infra.kopis;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KopisShowDto {
    private String kopisId;
    private String title;
    private String startDate;
    private String endDate;
    private String theaterName;
    private String genre;
    private String posterUrl;
    private String status;
}
