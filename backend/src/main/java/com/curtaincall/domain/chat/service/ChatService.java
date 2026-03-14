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
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

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
                .toList();
    }

    public List<ChatMessageDto> getMessageHistory(Long roomId, Long userId) {
        ChatRoom room = getRoom(roomId);
        ensureParticipant(room, userId);

        return chatMessageRepository.findRecentByRoomId(roomId, PageRequest.of(0, MESSAGE_HISTORY_LIMIT)).stream()
                .map(ChatMessageDto::from)
                .sorted(Comparator.comparing(ChatMessageDto::getCreatedAt))
                .toList();
    }

    @Transactional
    public ChatRoom createRoomForCompanionPost(CompanionPost post) {
        return chatRoomRepository.findByCompanionPostId(post.getId())
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.of(post)));
    }

    @Transactional
    public ChatMessageDto saveAndBroadcast(Long roomId, Long senderId, String content, ChatMessage.MessageType type) {
        ChatRoom room = getRoom(roomId);
        ensureParticipant(room, senderId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .type(type)
                .build();

        return ChatMessageDto.from(chatMessageRepository.save(message));
    }

    private ChatRoom getRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> BusinessException.notFound("채팅방을 찾을 수 없습니다."));
    }

    private void ensureParticipant(ChatRoom room, Long userId) {
        boolean isParticipant = companionParticipantRepository
                .existsByCompanionPostIdAndUserId(room.getCompanionPost().getId(), userId);
        if (!isParticipant) {
            throw BusinessException.forbidden("채팅방 참여자만 접근할 수 있습니다.");
        }
    }
}
