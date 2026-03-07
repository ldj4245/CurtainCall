package com.curtaincall.domain.chat.service;

import com.curtaincall.domain.chat.dto.ChatMessageDto;
import com.curtaincall.domain.chat.dto.ChatRoomDto;
import com.curtaincall.domain.chat.entity.ChatMessage;
import com.curtaincall.domain.chat.entity.ChatRoom;
import com.curtaincall.domain.chat.repository.ChatMessageRepository;
import com.curtaincall.domain.chat.repository.ChatRoomRepository;
import com.curtaincall.domain.companion.entity.CompanionPost;
import com.curtaincall.domain.companion.repository.CompanionParticipantRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private static final int MESSAGE_HISTORY_LIMIT = 100;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CompanionParticipantRepository companionParticipantRepository;
    private final UserRepository userRepository;

    public List<ChatRoomDto> getMyRooms(Long userId) {
        return chatRoomRepository.findRoomsByUserId(userId).stream()
                .map(ChatRoomDto::from)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDto> getMessageHistory(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        boolean isParticipant = companionParticipantRepository
                .existsByCompanionPostIdAndUserId(room.getCompanionPost().getId(), userId);
        if (!isParticipant) {
            throw new IllegalStateException("해당 채팅방에 접근 권한이 없습니다.");
        }

        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(
                roomId, PageRequest.of(0, MESSAGE_HISTORY_LIMIT)).stream()
                .map(ChatMessageDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatRoom createRoomForCompanionPost(CompanionPost post) {
        return chatRoomRepository.findByCompanionPostId(post.getId())
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.of(post)));
    }

    @Transactional
    public ChatMessageDto saveAndBroadcast(Long roomId, Long senderId, String content, ChatMessage.MessageType type) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .type(type)
                .build();

        return ChatMessageDto.from(chatMessageRepository.save(message));
    }
}
