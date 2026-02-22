package com.curtaincall.domain.admin.controller;

import com.curtaincall.infra.kopis.KopisSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "동기화 (개발용)", description = "KOPIS 데이터 동기화 API (개발용)")
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
@Slf4j
public class SyncController {

    private final KopisSyncService kopisSyncService;

    @Operation(summary = "KOPIS 공연 데이터 수동 동기화")
    @PostMapping("/shows")
    public ResponseEntity<Map<String, String>> syncShows(
            @RequestParam(defaultValue = "3") int months) {
        log.info("수동 공연 동기화 시작 - months: {}", months);
        kopisSyncService.manualSyncShows(months);
        return ResponseEntity.ok(Map.of("message", "공연 동기화가 완료되었습니다", "months", String.valueOf(months)));
    }

    @Operation(summary = "KOPIS 극장 데이터 수동 동기화")
    @PostMapping("/theaters")
    public ResponseEntity<Map<String, String>> syncTheaters() {
        log.info("수동 극장 동기화 시작");
        kopisSyncService.syncTheaters();
        return ResponseEntity.ok(Map.of("message", "극장 동기화가 완료되었습니다"));
    }

    @Operation(summary = "전체 데이터 동기화 (공연 + 극장)")
    @PostMapping("/all")
    public ResponseEntity<Map<String, String>> syncAll(
            @RequestParam(defaultValue = "3") int months) {
        log.info("전체 데이터 동기화 시작 - months: {}", months);
        kopisSyncService.syncTheaters();
        kopisSyncService.manualSyncShows(months);
        return ResponseEntity.ok(Map.of("message", "전체 동기화가 완료되었습니다"));
    }
}

