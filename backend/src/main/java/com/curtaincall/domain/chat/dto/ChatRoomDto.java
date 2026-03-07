package com.curtaincall.domain.chat.dto;

import com.curtaincall.domain.chat.entity.ChatRoom;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomDto {

    private Long id;
    private Long companionPostId;
    private String companionPostTitle;
    private String showTitle;
    private String showPosterUrl;
    private String performanceDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static ChatRoomDto from(ChatRoom room) {
        var post = room.getCompanionPost();
        return ChatRoomDto.builder()
                .id(room.getId())
                .companionPostId(post.getId())
                .companionPostTitle(post.getTitle())
                .showTitle(post.getShow().getTitle())
                .showPosterUrl(post.getShow().getPosterUrl())
                .performanceDate(post.getPerformanceDate().toString())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
