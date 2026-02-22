package com.curtaincall.domain.user.dto;

import com.curtaincall.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String nickname;
    private String email;
    private String profileImage;
    private String role;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .profileImage(user.getProfileImage())
                .role(user.getRole().name())
                .build();
    }
}
