package com.curtaincall.domain.user.service;

import com.curtaincall.domain.user.dto.AuthTokens;
import com.curtaincall.domain.user.dto.LoginRequest;
import com.curtaincall.domain.user.dto.SignUpRequest;
import com.curtaincall.domain.user.dto.TokenResponse;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import com.curtaincall.global.jwt.JwtTokenProvider;
import com.curtaincall.infra.oauth2.OAuth2AuthorizationCodeStore;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuth2AuthorizationCodeStore authorizationCodeStore;

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

        userRepository.save(user);
        return issueTokens(user);
    }

    public AuthTokens login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        if (!user.isLocalUser()) {
            throw BusinessException.badRequest("소셜 로그인 계정입니다. 소셜 로그인을 이용해 주세요.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw BusinessException.unauthorized("비밀번호가 일치하지 않습니다.");
        }

        return issueTokens(user);
    }

    public AuthTokens refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw BusinessException.unauthorized("유효하지 않은 토큰입니다.");
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw BusinessException.unauthorized("리프레시 토큰만 사용할 수 있습니다.");
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        return issueTokens(user);
    }

    public AuthTokens exchangeOAuth2Code(String code) {
        Long userId = authorizationCodeStore.consume(code)
                .orElseThrow(() -> BusinessException.unauthorized("유효하지 않거나 만료된 OAuth 인증 코드입니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        return issueTokens(user);
    }

    public boolean checkEmailDuplicate(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public TokenResponse toTokenResponse(AuthTokens tokens) {
        return TokenResponse.of(tokens.accessToken(), jwtTokenProvider.getAccessExpirationSeconds());
    }

    private AuthTokens issueTokens(User user) {
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
        return new AuthTokens(accessToken, refreshToken);
    }
}
