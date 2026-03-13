package com.curtaincall.domain.chat.service;

import com.curtaincall.domain.chat.dto.ChatMessageDto;
import com.curtaincall.domain.chat.entity.ChatMessage;
import com.curtaincall.domain.chat.entity.ChatRoom;
import com.curtaincall.domain.chat.repository.ChatMessageRepository;
import com.curtaincall.domain.chat.repository.ChatRoomRepository;
import com.curtaincall.domain.companion.entity.CompanionPost;
import com.curtaincall.domain.companion.repository.CompanionParticipantRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatRoomRepository chatRoomRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private CompanionParticipantRepository companionParticipantRepository;
    @Mock
    private UserRepository userRepository;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(
                chatRoomRepository,
                chatMessageRepository,
                companionParticipantRepository,
                userRepository
        );
    }

    @Test
    void getMessageHistoryRejectsNonParticipant() {
        ChatRoom room = chatRoom(1L, 10L);
        when(chatRoomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(companionParticipantRepository.existsByCompanionPostIdAndUserId(10L, 2L)).thenReturn(false);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> chatService.getMessageHistory(1L, 2L)
        );

        assertEquals("채팅방 참여자만 접근할 수 있습니다.", exception.getMessage());
    }

    @Test
    void getMessageHistoryReturnsRecentMessagesInChronologicalOrder() {
        ChatRoom room = chatRoom(1L, 10L);
        User sender = user(3L);
        ChatMessage newer = chatMessage(2L, room, sender, "두 번째", LocalDateTime.of(2026, 3, 14, 0, 10));
        ChatMessage older = chatMessage(1L, room, sender, "첫 번째", LocalDateTime.of(2026, 3, 14, 0, 5));

        when(chatRoomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(companionParticipantRepository.existsByCompanionPostIdAndUserId(10L, 2L)).thenReturn(true);
        when(chatMessageRepository.findRecentByRoomId(eq(1L), any(Pageable.class))).thenReturn(List.of(newer, older));

        List<ChatMessageDto> messages = chatService.getMessageHistory(1L, 2L);

        assertEquals(List.of("첫 번째", "두 번째"), messages.stream().map(ChatMessageDto::getContent).toList());
    }

    private ChatRoom chatRoom(Long roomId, Long postId) {
        ChatRoom room = ChatRoom.builder()
                .companionPost(CompanionPost.builder().id(postId).build())
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }

    private User user(Long userId) {
        User user = User.builder()
                .id(userId)
                .nickname("테스터")
                .email("tester@example.com")
                .role(User.Role.USER)
                .build();
        return user;
    }

    private ChatMessage chatMessage(Long id, ChatRoom room, User sender, String content, LocalDateTime createdAt) {
        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .type(ChatMessage.MessageType.TALK)
                .build();
        ReflectionTestUtils.setField(message, "id", id);
        ReflectionTestUtils.setField(message, "createdAt", createdAt);
        return message;
    }
}
