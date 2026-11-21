package com.curtaincall.domain.user.service;

import com.curtaincall.domain.user.dto.AuthTokens;
import com.curtaincall.domain.user.dto.LoginRequest;
import com.curtaincall.domain.user.dto.SignUpRequest;
import com.curtaincall.domain.user.dto.TokenResponse;
import com.curtaincall.domain.user.entity.RefreshToken;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.RefreshTokenRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import com.curtaincall.global.jwt.JwtTokenProvider;
import com.curtaincall.infra.oauth2.OAuth2AuthorizationCodeStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String LOGIN_ERROR_MESSAGE =
            "이메일 또는 비밀번호가 올바르지 않습니다. 소셜 가입 계정이라면 소셜 로그인을 이용해 주세요.";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuth2AuthorizationCodeStore authorizationCodeStore;

    @org.springframework.beans.factory.annotation.Value("${app.admin.emails:}")
    private String adminEmails;

    @Transactional
    public AuthTokens signUp(SignUpRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw BusinessException.conflict("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(User.Role.USER)
                .build();

        checkAndPromoteAdmin(user);
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthTokens login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null || user.isDeactivated() || !user.isLocalUser()
                || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw BusinessException.unauthorized(LOGIN_ERROR_MESSAGE);
        }

        checkAndPromoteAdmin(user);
        return issueTokens(user);
    }

    public void checkAndPromoteAdmin(User user) {
        if (user != null && user.getEmail() != null && adminEmails != null && !adminEmails.isBlank()) {
            for (String email : adminEmails.split(",")) {
                String trimmed = email.trim();
                if (!trimmed.isEmpty() && user.getEmail().trim().equalsIgnoreCase(trimmed)) {
                    if (user.getRole() != User.Role.ADMIN) {
                        user.promoteToAdmin();
                    }
                    break;
                }
            }
        }
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public AuthTokens refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw BusinessException.unauthorized("유효하지 않은 리프레시 토큰입니다.");
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String tokenHash = sha256(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> BusinessException.unauthorized("유효하지 않거나 만료된 세션입니다."));

        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(stored.getUserId());
            log.warn("Revoked refresh token reuse detected for userId={}", stored.getUserId());
            throw BusinessException.unauthorized("이미 사용되었거나 만료된 세션입니다. 다시 로그인해 주세요.");
        }

        if (stored.isExpired(LocalDateTime.now())) {
            stored.revoke();
            throw BusinessException.unauthorized("세션이 만료되었습니다. 다시 로그인해 주세요.");
        }

        stored.revoke();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.unauthorized("유효하지 않은 사용자입니다."));

        return issueTokens(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.revokeByTokenHash(sha256(refreshToken));
    }

    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Seoul")
    @Transactional
    public void purgeExpiredRefreshTokens() {
        refreshTokenRepository.deleteExpiredBefore(LocalDateTime.now().minusDays(1));
    }

    @Transactional
    public AuthTokens exchangeOAuth2Code(String code) {
        Long userId = authorizationCodeStore.consume(code)
                .orElseThrow(() -> BusinessException.unauthorized("유효하지 않거나 만료된 OAuth 인증 코드입니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        checkAndPromoteAdmin(user);
        return issueTokens(user);
    }

    public boolean checkEmailDuplicate(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public TokenResponse toTokenResponse(AuthTokens tokens) {
        return TokenResponse.of(tokens.accessToken(), jwtTokenProvider.getAccessExpirationSeconds());
    }

    private AuthTokens issueTokens(User user) {
        if (user.isDeactivated()) throw BusinessException.unauthorized("탈퇴한 계정입니다.");
        String accessToken = jwtTokenProvider.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.createRefreshToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
        refreshTokenRepository.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(sha256(refreshToken))
                .expiresAt(LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshExpirationSeconds()))
                .revoked(false)
                .build());
        return new AuthTokens(accessToken, refreshToken);
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}
