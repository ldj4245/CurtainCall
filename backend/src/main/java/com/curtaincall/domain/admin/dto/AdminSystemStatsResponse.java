package com.curtaincall.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminSystemStatsResponse {
    private String currentTime;
    private long totalShows;
    private long ongoingShows;
    private long upcomingShows;
    private long endedShows;
    private long totalTheaters;
    private long totalUsers;
    private long totalDiaries;
    private String estimatedDbUsageMb;
    private String lastSyncTime;
    private String lastSyncStatus;
}
