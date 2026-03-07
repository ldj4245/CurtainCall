package com.curtaincall.domain.chat.dto;

import com.curtaincall.domain.chat.entity.ChatMessage;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageDto {

    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderNickname;
    private String senderProfileImage;
    private String content;
    private ChatMessage.MessageType type;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static ChatMessageDto from(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
                .senderId(message.getSender().getId())
                .senderNickname(message.getSender().getNickname())
                .senderProfileImage(message.getSender().getProfileImage())
                .content(message.getContent())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
