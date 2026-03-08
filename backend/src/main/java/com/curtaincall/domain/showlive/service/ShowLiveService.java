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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowLiveService {

    private static final int MESSAGE_LIMIT = 50;

    private final ShowLiveRoomRepository roomRepository;
    private final ShowLiveMessageRepository messageRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;

    @Transactional
    public ShowLiveRoomDto getOrCreateRoom(Long showId, LocalDate date) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new IllegalArgumentException("공연을 찾을 수 없습니다."));

        ShowLiveRoom room = roomRepository.findByShowIdAndLiveDate(showId, date)
                .orElseGet(() -> roomRepository.save(ShowLiveRoom.of(show, date)));

        List<ShowLiveMessageDto> messages = messageRepository
                .findTop50ByRoomId(room.getId(), PageRequest.of(0, MESSAGE_LIMIT))
                .stream()
                .map(ShowLiveMessageDto::from)
                .collect(Collectors.toList());

        return ShowLiveRoomDto.builder()
                .roomId(room.getId())
                .showTitle(show.getTitle())
                .liveDate(date.toString())
                .messages(messages)
                .build();
    }

    @Transactional
    public ShowLiveMessageDto saveMessage(Long roomId, Long senderId, String content) {
        ShowLiveRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ShowLiveMessage message = ShowLiveMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .build();

        return ShowLiveMessageDto.from(messageRepository.save(message));
    }
}
