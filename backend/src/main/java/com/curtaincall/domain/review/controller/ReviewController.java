package com.curtaincall.domain.review.controller;

import com.curtaincall.domain.review.dto.*;
import com.curtaincall.domain.review.service.ReviewService;
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

import java.util.Map;

@Tag(name = "리뷰", description = "공연 리뷰 API")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "공연별 리뷰 목록 조회")
    @GetMapping("/shows/{showId}/reviews")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable Long showId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByShow(showId, sort, page, size, userId));
    }

    @Operation(summary = "리뷰 작성")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/shows/{showId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long showId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(userId, showId, request));
    }

    @Operation(summary = "리뷰 수정")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(userId, reviewId, request));
    }

    @Operation(summary = "리뷰 삭제")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId) {
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "리뷰 좋아요 토글")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/reviews/{reviewId}/like")
    public ResponseEntity<Map<String, Boolean>> toggleLike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId) {
        boolean liked = reviewService.toggleLike(userId, reviewId);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping("/reviews/{reviewId}/comments")
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable Long reviewId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reviewService.getComments(reviewId, page, size));
    }

    @Operation(summary = "댓글 작성")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/reviews/{reviewId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createComment(userId, reviewId, request));
    }

    @Operation(summary = "댓글 삭제")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId) {
        reviewService.deleteComment(userId, commentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "내 리뷰 목록")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/reviews/my")
    public ResponseEntity<Page<ReviewResponse>> getMyReviews(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getMyReviews(userId, page, size));
    }
}
