package com.curtaincall.infra.kopis;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class KopisSyncController {

    private final KopisSyncService kopisSyncService;

    @PostMapping("/enrich-theaters")
    public ResponseEntity<Map<String, String>> enrichTheaters() {
        kopisSyncService.enrichAllTheaterRegions();
        return ResponseEntity.ok(Map.of("message", "극장 지역 정보 보강이 완료되었습니다"));
    }
}
