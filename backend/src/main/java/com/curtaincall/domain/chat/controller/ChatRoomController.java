package com.curtaincall.domain.chat.controller;

import com.curtaincall.domain.chat.dto.ChatMessageDto;
import com.curtaincall.domain.chat.dto.ChatRoomDto;
import com.curtaincall.domain.chat.service.ChatService;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDto>> getMyRooms(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            throw BusinessException.unauthorized("인증이 필요합니다.");
        }
        return ResponseEntity.ok(chatService.getMyRooms(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal Long userId) {
        if (userId == null) {
            throw BusinessException.unauthorized("인증이 필요합니다.");
        }
        return ResponseEntity.ok(chatService.getMessageHistory(roomId, userId));
    }
}
