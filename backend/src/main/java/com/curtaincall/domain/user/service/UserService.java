package com.curtaincall.domain.user.service;

import com.curtaincall.domain.user.dto.UserResponse;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getMe(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
    }

    @Transactional
    public UserResponse updateNickname(Long userId, String nickname) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        user.updateProfile(nickname, user.getProfileImage());
        return UserResponse.from(user);
    }
}
