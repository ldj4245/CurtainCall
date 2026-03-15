package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.show.entity.Show;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class TicketDraftShowDto {

    private Long id;
    private String title;
    private String posterUrl;
    private String theaterName;
    private LocalDate startDate;
    private LocalDate endDate;

    public static TicketDraftShowDto from(Show show) {
        return TicketDraftShowDto.builder()
                .id(show.getId())
                .title(show.getTitle())
                .posterUrl(show.getPosterUrl())
                .theaterName(show.getTheater() != null ? show.getTheater().getName() : null)
                .startDate(show.getStartDate())
                .endDate(show.getEndDate())
                .build();
    }
}
