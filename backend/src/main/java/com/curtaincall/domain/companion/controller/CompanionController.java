package com.curtaincall.domain.companion.controller;

import com.curtaincall.domain.companion.dto.CompanionPostRequest;
import com.curtaincall.domain.companion.dto.CompanionPostResponse;
import com.curtaincall.domain.companion.service.CompanionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class CompanionController {

    private final CompanionService companionService;

    @GetMapping("/shows/{showId}/companions")
    public ResponseEntity<Page<CompanionPostResponse>> getCompanions(
            @PathVariable Long showId,
            @RequestParam(defaultValue = "false") boolean onlyOpen,
            @PageableDefault(sort = "performanceDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(companionService.getCompanions(showId, onlyOpen, pageable));
    }

    @GetMapping("/companions/recent")
    public ResponseEntity<Page<CompanionPostResponse>> getRecentCompanions(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 4) Pageable pageable) {
        return ResponseEntity.ok(companionService.getRecentCompanions(pageable));
    }

    @PostMapping("/shows/{showId}/companions")
    public ResponseEntity<Long> createCompanionPost(
            @PathVariable Long showId,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CompanionPostRequest request) {
        Long postId = companionService.createCompanionPost(showId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(postId);
    }

    @PostMapping("/companions/{id}/join")
    public ResponseEntity<Void> joinCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        companionService.joinCompanion(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/companions/{id}/join")
    public ResponseEntity<Void> cancelJoin(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        companionService.cancelJoin(id, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/companions/{id}/close")
    public ResponseEntity<Void> closeCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        companionService.closeCompanion(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/companions/{id}")
    public ResponseEntity<Void> deleteCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        companionService.deleteCompanion(id, userId);
        return ResponseEntity.noContent().build();
    }
}
