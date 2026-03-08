package com.curtaincall.domain.showlive.dto;

import com.curtaincall.domain.showlive.entity.ShowLiveMessage;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ShowLiveMessageDto {

    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderNickname;
    private String senderProfileImage;
    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static ShowLiveMessageDto from(ShowLiveMessage message) {
        return ShowLiveMessageDto.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
                .senderId(message.getSender().getId())
                .senderNickname(message.getSender().getNickname())
                .senderProfileImage(message.getSender().getProfileImage())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
