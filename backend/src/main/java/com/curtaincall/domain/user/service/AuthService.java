package com.curtaincall.domain.user.service;

import com.curtaincall.domain.user.dto.LoginRequest;
import com.curtaincall.domain.user.dto.SignUpRequest;
import com.curtaincall.domain.user.dto.TokenResponse;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.CustomException;
import com.curtaincall.global.exception.ErrorCode;
import com.curtaincall.global.jwt.JwtTokenProvider;
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

    @Transactional
    public TokenResponse signUp(SignUpRequest request) {
        // 이메일 중복 확인
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(User.Role.USER)
                .build();

        userRepository.save(user);

        // 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail());

        return TokenResponse.of(accessToken, refreshToken);
    }

    public TokenResponse login(LoginRequest request) {
        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 자체 로그인 사용자인지 확인
        if (!user.isLocalUser()) {
            throw new CustomException(ErrorCode.SOCIAL_LOGIN_USER);
        }

        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail());

        return TokenResponse.of(accessToken, refreshToken);
    }

    public TokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String email = jwtTokenProvider.getEmail(refreshToken);

        String newAccessToken = jwtTokenProvider.createAccessToken(userId, email);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId, email);

        return TokenResponse.of(newAccessToken, newRefreshToken);
    }

    public boolean checkEmailDuplicate(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
}

