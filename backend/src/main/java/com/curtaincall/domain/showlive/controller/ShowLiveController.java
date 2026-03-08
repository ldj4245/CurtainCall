package com.curtaincall.domain.showlive.controller;

import com.curtaincall.domain.showlive.dto.ShowLiveMessageDto;
import com.curtaincall.domain.showlive.dto.ShowLiveMessageRequest;
import com.curtaincall.domain.showlive.dto.ShowLiveRoomDto;
import com.curtaincall.domain.showlive.service.ShowLiveService;
import com.curtaincall.global.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ShowLiveController {

    private final ShowLiveService showLiveService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/api/shows/{showId}/live")
    public ResponseEntity<ShowLiveRoomDto> getRoom(
            @PathVariable Long showId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest request) {
        LocalDate liveDate = date != null ? date : LocalDate.now();
        ShowLiveRoomDto room = showLiveService.getOrCreateRoom(showId, liveDate);
        return ResponseEntity.ok(room);
    }

    @MessageMapping("/live/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ShowLiveMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {

        Principal principal = headerAccessor.getUser();
        if (principal == null || request.getContent() == null || request.getContent().isBlank()) return;

        Long senderId = Long.parseLong(principal.getName());
        ShowLiveMessageDto message = showLiveService.saveMessage(roomId, senderId, request.getContent());
        messagingTemplate.convertAndSend("/sub/live/" + roomId, message);
    }
}
