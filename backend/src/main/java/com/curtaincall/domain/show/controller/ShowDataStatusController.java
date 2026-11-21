package com.curtaincall.domain.show.controller;
import com.curtaincall.domain.show.service.BoxOfficeScheduler;
import com.curtaincall.infra.kopis.KopisSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequiredArgsConstructor
public class ShowDataStatusController {
    private final KopisSyncService sync;
    private final BoxOfficeScheduler ranking;
    @GetMapping("/api/shows/data-status") public Map<String, String> status() {
        return Map.of("source", "KOPIS", "lastSyncTime", sync.getLastSyncTime(), "lastSyncStatus", sync.getLastSyncStatus(),
            "rankingStatus", ranking.getLastRankStatus(), "rankingLastSuccess", ranking.getLastRankSuccess(),
            "rankingBasis", "갱신일 기준 어제까지의 최근 7일 박스오피스 · 매일 06시 갱신");
    }
}
