package com.curtaincall.domain.user.controller;

import com.curtaincall.domain.user.dto.AuthTokens;
import com.curtaincall.domain.user.dto.LoginRequest;
import com.curtaincall.domain.user.dto.OAuth2ExchangeRequest;
import com.curtaincall.domain.user.dto.SignUpRequest;
import com.curtaincall.domain.user.dto.TokenResponse;
import com.curtaincall.domain.user.service.AuthService;
import com.curtaincall.global.exception.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

@Tag(name = "Auth", description = "Authentication APIs")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Operation(summary = "Sign up")
    @PostMapping("/signup")
    public ResponseEntity<TokenResponse> signUp(@Valid @RequestBody SignUpRequest request,
                                                HttpServletResponse response) {
        AuthTokens tokens = authService.signUp(request);
        addRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.toTokenResponse(tokens));
    }

    @Operation(summary = "Login")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        AuthTokens tokens = authService.login(request);
        addRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(authService.toTokenResponse(tokens));
    }

    @Operation(summary = "Refresh access token")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.refreshToken(extractRefreshToken(request));
        addRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(authService.toTokenResponse(tokens));
    }

    @Operation(summary = "Exchange OAuth code")
    @PostMapping("/oauth2/exchange")
    public ResponseEntity<TokenResponse> exchangeOAuth2Code(@Valid @RequestBody OAuth2ExchangeRequest request,
                                                            HttpServletResponse response) {
        AuthTokens tokens = authService.exchangeOAuth2Code(request.getCode());
        addRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(authService.toTokenResponse(tokens));
    }

    @Operation(summary = "Logout")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Check duplicate email")
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean isDuplicate = authService.checkEmailDuplicate(email);
        return ResponseEntity.ok(Map.of("duplicate", isDuplicate));
    }

    private String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw BusinessException.unauthorized("리프레시 토큰 쿠키가 필요합니다.");
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_TOKEN_COOKIE.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> BusinessException.unauthorized("리프레시 토큰 쿠키가 필요합니다."));
    }

    private void addRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(frontendUrl.startsWith("https://"))
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofDays(7))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(frontendUrl.startsWith("https://"))
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
