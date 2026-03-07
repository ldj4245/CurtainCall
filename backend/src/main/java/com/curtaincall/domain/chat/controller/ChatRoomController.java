package com.curtaincall.domain.chat.controller;

import com.curtaincall.domain.chat.dto.ChatMessageDto;
import com.curtaincall.domain.chat.dto.ChatRoomDto;
import com.curtaincall.domain.chat.service.ChatService;
import com.curtaincall.global.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatService chatService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDto>> getMyRooms(HttpServletRequest request) {
        Long userId = extractUserId(request);
        return ResponseEntity.ok(chatService.getMyRooms(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Long roomId,
            HttpServletRequest request) {
        Long userId = extractUserId(request);
        return ResponseEntity.ok(chatService.getMessageHistory(roomId, userId));
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalStateException("인증 토큰이 필요합니다.");
        }
        return jwtTokenProvider.getUserId(authHeader.substring(7));
    }
}
