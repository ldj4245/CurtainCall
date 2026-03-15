package com.curtaincall.domain.diary.service;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Builder
public record TicketDraftExtractionResult(
        String showTitle,
        String theaterName,
        LocalDate watchedDate,
        LocalTime performanceTime,
        String seatInfo,
        Integer ticketPrice,
        double confidence,
        List<String> warnings
) {
}
