package com.curtaincall.domain.show.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ShowHomeSectionsResponse {

    private List<ShowResponse> popular;
    private List<ShowResponse> endingSoon;
    private List<ShowResponse> openingThisMonth;
    private List<ShowResponse> mostRecorded;
}
