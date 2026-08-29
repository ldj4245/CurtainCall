package com.curtaincall.domain.show.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class ShowScheduleResponse {

    private LocalDate date;
    private String dayOfWeek;
    private int totalShowsToday;
    private List<TimeSlot> timeSlots;

    @Getter
    @Builder
    public static class TimeSlot {
        private String time;
        private String label;
        private int count;
        private List<ScheduleShowItem> shows;
    }

    @Getter
    @Builder
    public static class ScheduleShowItem {
        private Long id;
        private String kopisId;
        private String title;
        private String genre;
        private String genreDisplayName;
        private String theaterName;
        private String posterUrl;
        private String runtime;
        private String priceInfo;
        private String castInfo;
        private String time;
    }
}
