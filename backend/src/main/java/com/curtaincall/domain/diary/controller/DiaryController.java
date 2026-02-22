package com.curtaincall.domain.diary.controller;

import com.curtaincall.domain.diary.dto.DiaryRequest;
import com.curtaincall.domain.diary.dto.DiaryResponse;
import com.curtaincall.domain.diary.dto.DiaryStatsDto;
import com.curtaincall.domain.diary.service.DiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "관극 다이어리", description = "관극 기록 API")
@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class DiaryController {

    private final DiaryService diaryService;

    @Operation(summary = "내 관극 기록 목록 조회")
    @GetMapping("/me")
    public ResponseEntity<Page<DiaryResponse>> getMyDiary(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(diaryService.getMyDiary(userId, page, size));
    }

    @Operation(summary = "내 관극 통계 조회")
    @GetMapping("/me/stats")
    public ResponseEntity<DiaryStatsDto> getMyStats(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(diaryService.getMyStats(userId));
    }

    @Operation(summary = "관극 기록 작성")
    @PostMapping
    public ResponseEntity<DiaryResponse> createDiary(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody DiaryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diaryService.createDiary(userId, request));
    }

    @Operation(summary = "관극 기록 수정")
    @PutMapping("/{id}")
    public ResponseEntity<DiaryResponse> updateDiary(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody DiaryRequest request) {
        return ResponseEntity.ok(diaryService.updateDiary(userId, id, request));
    }

    @Operation(summary = "관극 기록 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiary(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        diaryService.deleteDiary(userId, id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "월별 캘린더 관극 기록 조회")
    @GetMapping("/me/calendar")
    public ResponseEntity<java.util.List<DiaryResponse>> getCalendarDiary(
            @AuthenticationPrincipal Long userId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(diaryService.getCalendarDiary(userId, year, month));
    }
}
