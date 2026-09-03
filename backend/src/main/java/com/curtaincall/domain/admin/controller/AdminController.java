package com.curtaincall.domain.admin.controller;

import com.curtaincall.domain.admin.dto.AdminSystemStatsResponse;
import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.show.service.BoxOfficeScheduler;
import com.curtaincall.domain.theater.repository.TheaterRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.infra.kopis.KopisSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Tag(name = "관리자", description = "관리자 API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final KopisSyncService kopisSyncService;
    private final BoxOfficeScheduler boxOfficeScheduler;
    private final ShowRepository showRepository;
    private final TheaterRepository theaterRepository;
    private final UserRepository userRepository;
    private final DiaryEntryRepository diaryEntryRepository;

    private static final DateTimeFormatter KST_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Operation(summary = "운영 시스템 현황 및 DB 사용량 조회")
    @GetMapping("/system-stats")
    public ResponseEntity<AdminSystemStatsResponse> getSystemStats() {
        long totalShows = showRepository.count();
        long ongoingShows = showRepository.countByStatus(Show.Status.ONGOING);
        long upcomingShows = showRepository.countByStatus(Show.Status.UPCOMING);
        long endedShows = showRepository.countByStatus(Show.Status.ENDED);
        long totalTheaters = theaterRepository.count();
        long totalUsers = userRepository.count();
        long totalDiaries = diaryEntryRepository.count();

        // 5MB 무료 쿼터 대비 대략적인 용량 계산 (공연당 약 1.6KB + 극장/다이어리 등)
        double estimatedMb = (totalShows * 1.6 + totalTheaters * 0.8 + totalDiaries * 1.0) / 1024.0 + 0.3;
        String dbUsage = String.format("%.2f MB / 5.00 MB (%.1f%%)", estimatedMb, (estimatedMb / 5.0) * 100);

        String kstNow = ZonedDateTime.now(ZoneId.of("Asia/Seoul")).format(KST_FORMATTER) + " (KST)";

        return ResponseEntity.ok(AdminSystemStatsResponse.builder()
                .currentTime(kstNow)
                .totalShows(totalShows)
                .ongoingShows(ongoingShows)
                .upcomingShows(upcomingShows)
                .endedShows(endedShows)
                .totalTheaters(totalTheaters)
                .totalUsers(totalUsers)
                .totalDiaries(totalDiaries)
                .estimatedDbUsageMb(dbUsage)
                .lastSyncTime(kopisSyncService.getLastSyncTime())
                .lastSyncStatus(kopisSyncService.getLastSyncStatus())
                .build());
    }

    @Operation(summary = "공연 상태 및 박스오피스 순위 즉시 갱신")
    @PostMapping("/sync/status-rankings")
    public ResponseEntity<Map<String, String>> syncStatusAndRankings() {
        boxOfficeScheduler.refreshBoxOffice();
        return ResponseEntity.ok(Map.of("message", "공연 상태 보정 및 박스오피스 순위 갱신이 완료되었습니다."));
    }

    @Operation(summary = "KOPIS 신규 공연 즉시 동기화")
    @PostMapping("/sync/shows")
    public ResponseEntity<Map<String, String>> syncShows(
            @RequestParam(defaultValue = "3") int months) {
        kopisSyncService.syncShows();
        return ResponseEntity.ok(Map.of("message", "KOPIS 신규 공연 동기화 및 점검이 완료되었습니다."));
    }

    @Operation(summary = "오래된 미참조 종료 공연 정리 (5MB DB 용량 확보)")
    @PostMapping("/prune-ended")
    public ResponseEntity<Map<String, Object>> pruneEndedShows(
            @RequestParam(defaultValue = "30") int daysAfterEnd) {
        int deleted = kopisSyncService.pruneOldEndedShows(daysAfterEnd);
        return ResponseEntity.ok(Map.of(
                "message", "종료 후 " + daysAfterEnd + "일 경과한 미참조 공연 " + deleted + "건을 정리했습니다.",
                "deletedCount", deleted
        ));
    }

    @Operation(summary = "KOPIS 극장 데이터 동기화")
    @PostMapping("/sync/theaters")
    public ResponseEntity<Map<String, String>> syncTheaters() {
        kopisSyncService.syncTheaters();
        return ResponseEntity.ok(Map.of("message", "극장 동기화가 완료되었습니다"));
    }
}
