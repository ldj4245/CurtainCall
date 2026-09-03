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

    @org.springframework.beans.factory.annotation.Value("${app.admin.emails:ldj4241@naver.com}")
    private String adminEmails;

    @Transactional
    public UserResponse getMe(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        if (user.getEmail() != null && adminEmails != null) {
            for (String email : adminEmails.split(",")) {
                if (user.getEmail().trim().equalsIgnoreCase(email.trim())) {
                    if (user.getRole() != com.curtaincall.domain.user.entity.User.Role.ADMIN) {
                        user.promoteToAdmin();
                    }
                    break;
                }
            }
        }

        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateNickname(Long userId, String nickname) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        user.updateProfile(nickname.trim(), user.getProfileImage());
        return UserResponse.from(user);
    }
}
