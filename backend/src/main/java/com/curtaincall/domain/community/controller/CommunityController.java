package com.curtaincall.domain.community.controller;

import com.curtaincall.domain.community.dto.*;
import com.curtaincall.domain.community.service.CommunityService;
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

@Tag(name = "커뮤니티", description = "공통 커뮤니티 게시판 API")
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @Operation(summary = "커뮤니티 게시글 목록 조회")
    @GetMapping("/posts")
    public ResponseEntity<Page<CommunityPostSummaryResponse>> getPosts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(communityService.getPosts(category, keyword, sort, page, size, userId));
    }

    @Operation(summary = "내 커뮤니티 게시글 목록")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/posts/my")
    public ResponseEntity<Page<CommunityPostSummaryResponse>> getMyPosts(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(communityService.getMyPosts(userId, page, size));
    }

    @Operation(summary = "커뮤니티 게시글 상세 조회")
    @GetMapping("/posts/{postId}")
    public ResponseEntity<CommunityPostDetailResponse> getPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "true") boolean countView,
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(communityService.getPost(postId, countView, userId));
    }

    @Operation(summary = "커뮤니티 게시글 작성")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/posts")
    public ResponseEntity<CommunityPostDetailResponse> createPost(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CommunityPostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createPost(userId, request));
    }

    @Operation(summary = "커뮤니티 게시글 수정")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/posts/{postId}")
    public ResponseEntity<CommunityPostDetailResponse> updatePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommunityPostRequest request) {
        return ResponseEntity.ok(communityService.updatePost(userId, postId, request));
    }

    @Operation(summary = "커뮤니티 게시글 삭제")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId) {
        communityService.deletePost(userId, postId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "커뮤니티 게시글 공감 토글")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<CommunityLikeResponse> toggleLike(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId) {
        return ResponseEntity.ok(communityService.toggleLike(userId, postId));
    }

    @Operation(summary = "커뮤니티 게시글 댓글 목록")
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommunityCommentResponse>> getComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(communityService.getComments(postId, page, size));
    }

    @Operation(summary = "커뮤니티 게시글 댓글 작성")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommunityCommentResponse> createComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long postId,
            @Valid @RequestBody CommunityCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createComment(userId, postId, request));
    }

    @Operation(summary = "커뮤니티 댓글 삭제")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId) {
        communityService.deleteComment(userId, commentId);
        return ResponseEntity.noContent().build();
    }
}
