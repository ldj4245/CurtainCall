package com.curtaincall.domain.diary.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class TicketDraftResponse {

    private TicketDraftShowDto matchedShow;
    private List<TicketDraftShowDto> suggestions;
    private LocalDate watchedDate;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime performanceTime;
    private String theaterName;
    private String seatInfo;
    private Integer ticketPrice;
    private double confidence;
    private List<String> warnings;
}
