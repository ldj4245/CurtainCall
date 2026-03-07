package com.curtaincall.domain.chat.dto;

import com.curtaincall.domain.chat.entity.ChatMessage;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequest {
    private String content;
    private ChatMessage.MessageType type = ChatMessage.MessageType.TALK;
}
