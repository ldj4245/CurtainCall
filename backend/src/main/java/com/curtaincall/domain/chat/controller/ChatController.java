package com.curtaincall.domain.chat.controller;

import com.curtaincall.domain.chat.dto.ChatMessageDto;
import com.curtaincall.domain.chat.dto.ChatMessageRequest;
import com.curtaincall.domain.chat.entity.ChatMessage;
import com.curtaincall.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ChatMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("Unauthenticated WebSocket message received for room {}", roomId);
            return;
        }

        Long senderId = Long.parseLong(principal.getName());
        ChatMessage.MessageType type = request.getType() != null ? request.getType() : ChatMessage.MessageType.TALK;

        if (type == ChatMessage.MessageType.TALK
                && (request.getContent() == null || request.getContent().isBlank())) {
            return;
        }

        ChatMessageDto message = chatService.saveAndBroadcast(roomId, senderId, request.getContent(), type);
        messagingTemplate.convertAndSend("/sub/chat/" + roomId, message);
    }
}
