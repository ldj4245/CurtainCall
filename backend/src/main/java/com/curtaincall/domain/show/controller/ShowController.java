package com.curtaincall.domain.show.controller;

import com.curtaincall.domain.show.dto.ShowResponse;
import com.curtaincall.domain.show.service.ShowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "공연", description = "공연 탐색 API")
@RestController
@RequestMapping("/api/shows")
@RequiredArgsConstructor
public class ShowController {

    private final ShowService showService;

    @Operation(summary = "공연 목록 조회", description = "필터와 검색어로 공연을 조회합니다.")
    @GetMapping
    public ResponseEntity<Page<ShowResponse>> searchShows(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(showService.searchShows(keyword, genre, status, region, page, size));
    }

    @Operation(summary = "공연 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ShowResponse> getShow(@PathVariable Long id) {
        return ResponseEntity.ok(showService.getShow(id));
    }

    @Operation(summary = "현재 공연 중인 공연 목록 (홈 화면용)")
    @GetMapping("/ongoing")
    public ResponseEntity<List<ShowResponse>> getOngoingShows(
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(showService.getOngoingShows(limit));
    }
}
