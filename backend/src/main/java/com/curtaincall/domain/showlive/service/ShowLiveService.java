package com.curtaincall.domain.showlive.service;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.showlive.dto.ShowLiveMessageDto;
import com.curtaincall.domain.showlive.dto.ShowLiveRoomDto;
import com.curtaincall.domain.showlive.entity.ShowLiveMessage;
import com.curtaincall.domain.showlive.entity.ShowLiveRoom;
import com.curtaincall.domain.showlive.repository.ShowLiveMessageRepository;
import com.curtaincall.domain.showlive.repository.ShowLiveRoomRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowLiveService {

    private static final int MESSAGE_LIMIT = 50;

    private final ShowLiveRoomRepository roomRepository;
    private final ShowLiveMessageRepository messageRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final com.curtaincall.domain.safety.UserBlockRepository blocks;

    public ShowLiveRoomDto getRoom(Long showId, LocalDate date) {
        Show show = loadShow(showId);
        return roomRepository.findByShowIdAndLiveDate(showId, date)
                .map(room -> toRoomDto(show, date, room))
                .orElseGet(() -> toRoomDto(show, date, null));
    }

    public ShowLiveRoomDto filterBlocked(ShowLiveRoomDto dto, Long userId) {
        if (userId == null) return dto;
        var ids = blocks.findByUserId(userId).stream().map(com.curtaincall.domain.safety.UserBlock::getBlockedUserId).collect(java.util.stream.Collectors.toSet());
        return ShowLiveRoomDto.builder().roomId(dto.getRoomId()).showTitle(dto.getShowTitle()).liveDate(dto.getLiveDate())
                .messages(dto.getMessages().stream().filter(m -> !ids.contains(m.getSenderId())).toList()).build();
    }

    @Transactional
    public ShowLiveRoomDto getOrCreateRoom(Long showId, LocalDate date) {
        Show show = loadShow(showId);

        ShowLiveRoom room = roomRepository.findByShowIdAndLiveDate(showId, date)
                .orElseGet(() -> roomRepository.save(ShowLiveRoom.of(show, date)));

        return toRoomDto(show, date, room);
    }

    @Transactional
    public ShowLiveMessageDto saveMessage(Long roomId, Long senderId, String content) {
        if (content == null || content.isBlank() || content.length() > 2000) throw BusinessException.badRequest("메시지는 1~2000자로 입력해 주세요.");
        ShowLiveRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> BusinessException.notFound("라이브 채팅방을 찾을 수 없습니다."));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        ShowLiveMessage message = ShowLiveMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .build();

        return ShowLiveMessageDto.from(messageRepository.save(message));
    }

    private Show loadShow(Long showId) {
        return showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));
    }

    private ShowLiveRoomDto toRoomDto(Show show, LocalDate date, ShowLiveRoom room) {
        List<ShowLiveMessageDto> messages = room == null
                ? List.of()
                : messageRepository.findRecentByRoomId(room.getId(), PageRequest.of(0, MESSAGE_LIMIT))
                        .stream()
                        .map(ShowLiveMessageDto::from)
                        .sorted(Comparator.comparing(ShowLiveMessageDto::getCreatedAt))
                        .toList();

        return ShowLiveRoomDto.builder()
                .roomId(room != null ? room.getId() : null)
                .showTitle(show.getTitle())
                .liveDate(date.toString())
                .messages(messages)
                .build();
    }
}
