package com.curtaincall.domain.casting.controller;

import com.curtaincall.domain.casting.dto.CastingResponse;
import com.curtaincall.domain.casting.service.CastingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "캐스팅", description = "배역별 출연진 API")
@RestController
@RequestMapping("/api/shows/{showId}/casting")
@RequiredArgsConstructor
public class CastingController {

    private final CastingService castingService;

    @Operation(summary = "배역별 출연진 조회", description = "해당 공연의 배역별 출연진 정보를 반환합니다.")
    @GetMapping
    public ResponseEntity<List<CastingResponse>> getCasting(@PathVariable Long showId) {
        return ResponseEntity.ok(castingService.getCastingByShow(showId));
    }

    @Operation(summary = "캐스팅 정보 수동 갱신 (관리자용)", description = "PlayDB에서 해당 공연의 캐스팅 정보를 다시 크롤링합니다.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/refresh")
    public ResponseEntity<String> refreshCasting(@PathVariable Long showId) {
        castingService.refreshCasting(showId);
        return ResponseEntity.ok("캐스팅 정보가 갱신되었습니다.");
    }
}
