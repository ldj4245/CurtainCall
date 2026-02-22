package com.curtaincall.domain.user.controller;

import com.curtaincall.domain.user.dto.UserResponse;
import com.curtaincall.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "사용자", description = "사용자 정보 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userService.getMe(userId));
    }

    @Operation(summary = "닉네임 변경")
    @PatchMapping("/me/nickname")
    public ResponseEntity<UserResponse> updateNickname(
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateNickname(userId, body.get("nickname")));
    }
}
