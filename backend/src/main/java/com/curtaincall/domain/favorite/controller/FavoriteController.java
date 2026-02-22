package com.curtaincall.domain.favorite.controller;

import com.curtaincall.domain.favorite.service.FavoriteShowService;
import com.curtaincall.domain.show.dto.ShowResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "찜", description = "공연 찜하기 API")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteShowService favoriteShowService;

    @Operation(summary = "찜 토글", description = "공연을 찜하거나 찜 해제합니다.")
    @PostMapping("/shows/{showId}")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long showId) {
        return ResponseEntity.ok(favoriteShowService.toggleFavorite(userId, showId));
    }

    @Operation(summary = "찜 상태 확인")
    @GetMapping("/shows/{showId}/status")
    public ResponseEntity<Map<String, Object>> getFavoriteStatus(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long showId) {
        boolean isFavorited = favoriteShowService.isFavorited(userId, showId);
        long count = favoriteShowService.getFavoriteCount(showId);
        return ResponseEntity.ok(Map.of("isFavorited", isFavorited, "favoriteCount", count));
    }

    @Operation(summary = "내 찜 목록")
    @GetMapping("/my")
    public ResponseEntity<Page<ShowResponse>> getMyFavorites(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(favoriteShowService.getMyFavorites(userId, page, size));
    }
}
