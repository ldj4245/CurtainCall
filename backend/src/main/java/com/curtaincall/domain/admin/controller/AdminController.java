package com.curtaincall.domain.admin.controller;

import com.curtaincall.infra.kopis.KopisSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "관리자", description = "관리자 API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final KopisSyncService kopisSyncService;

    @Operation(summary = "KOPIS 공연 데이터 동기화")
    @PostMapping("/sync/shows")
    public ResponseEntity<Map<String, String>> syncShows(
            @RequestParam(defaultValue = "3") int months) {
        kopisSyncService.manualSyncShows(months);
        return ResponseEntity.ok(Map.of("message", "공연 동기화가 시작되었습니다"));
    }

    @Operation(summary = "KOPIS 극장 데이터 동기화")
    @PostMapping("/sync/theaters")
    public ResponseEntity<Map<String, String>> syncTheaters() {
        kopisSyncService.syncTheaters();
        return ResponseEntity.ok(Map.of("message", "극장 동기화가 완료되었습니다"));
    }
}

