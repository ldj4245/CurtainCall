package com.curtaincall.domain.diary.controller;

import com.curtaincall.domain.diary.dto.*;
import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;

@RestController @RequiredArgsConstructor @Transactional(readOnly = true)
public class DiarySharingController {
    private final DiaryEntryRepository diaries;

    @PostMapping("/api/diary/{id}/share") @Transactional
    public Map<String, String> share(@AuthenticationPrincipal Long user, @PathVariable Long id) {
        var d = diaries.findByIdAndUserId(id, user).orElseThrow(() -> BusinessException.notFound("기록을 찾을 수 없습니다."));
        if (!Boolean.TRUE.equals(d.getIsOpen())) throw BusinessException.badRequest("공개 기록만 링크를 만들 수 있습니다.");
        return Map.of("path", "/shared/" + d.createShareToken());
    }
    @GetMapping("/api/shared/{token}")
    public DiaryResponse shared(@PathVariable String token) {
        return diaries.findByShareTokenAndIsOpenTrue(token).map(DiaryResponse::from)
                .orElseThrow(() -> BusinessException.notFound("공개된 기록이 없습니다."));
    }
    @GetMapping("/api/shows/{showId}/public-records")
    public Page<DiarySnippetItemDto> records(@PathVariable Long showId,
            @RequestParam(defaultValue = "false") boolean seatsOnly,
            @RequestParam(defaultValue = "") String seat,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return diaries.findPublicRecords(showId, seatsOnly, seat.strip(), PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 50))))
                .map(DiarySnippetItemDto::from);
    }
    @GetMapping("/api/diary/me/month")
    public Map<String, Object> month(@AuthenticationPrincipal Long user, @RequestParam int year, @RequestParam int month) {
        YearMonth ym;
        try { ym = YearMonth.of(year, month); }
        catch (DateTimeException e) { throw BusinessException.badRequest("올바른 연월을 선택해 주세요."); }
        var entries = diaries.findByUserIdAndWatchedDateBetween(user, ym.atDay(1), ym.atEndOfMonth());
        return Map.of("month", ym.toString(), "count", entries.size(),
                "totalSpent", entries.stream().filter(d -> d.getTicketPrice() != null).mapToLong(d -> d.getTicketPrice()).sum(),
                "averageRating", entries.stream().filter(d -> d.getRating() != null).mapToInt(d -> d.getRating()).average().orElse(0),
                "entries", entries.stream().map(DiaryResponse::from).toList());
    }
    @GetMapping("/api/diary/me/export")
    public List<DiaryResponse> export(@AuthenticationPrincipal Long user) {
        return diaries.findAllByUserIdWithShow(user).stream().map(DiaryResponse::from).toList();
    }
}
