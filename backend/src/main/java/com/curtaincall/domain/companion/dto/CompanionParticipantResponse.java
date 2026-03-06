package com.curtaincall.domain.companion.dto;

import com.curtaincall.domain.companion.entity.CompanionParticipant;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CompanionParticipantResponse {
    private Long id;
    private Long userId;
    private String nickname;
    private String profileImage;
    private LocalDateTime joinedAt;

    public static CompanionParticipantResponse from(CompanionParticipant participant) {
        return CompanionParticipantResponse.builder()
                .id(participant.getId())
                .userId(participant.getUser().getId())
                .nickname(participant.getUser().getNickname())
                .profileImage(participant.getUser().getProfileImage())
                .joinedAt(participant.getCreatedAt())
                .build();
    }
}
