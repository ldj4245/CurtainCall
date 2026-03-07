package com.curtaincall.domain.companion.dto;

import com.curtaincall.domain.companion.entity.CompanionPost;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CompanionPostResponse {
    private Long id;
    private Long showId;
    private String showTitle;
    private Long authorId;
    private String authorNickname;
    private String authorProfileImage;

    private String title;
    private String content;
    private LocalDate performanceDate;
    private String performanceTime;

    private int maxMembers;
    private int currentMembers;
    private String seatInfo;
    private CompanionPost.Status status;
    private LocalDateTime createdAt;

    private List<CompanionParticipantResponse> participants;
    private Long chatRoomId;

    public static CompanionPostResponse from(CompanionPost post, List<CompanionParticipantResponse> participants) {
        return CompanionPostResponse.builder()
                .id(post.getId())
                .showId(post.getShow().getId())
                .showTitle(post.getShow().getTitle())
                .authorId(post.getAuthor().getId())
                .authorNickname(post.getAuthor().getNickname())
                .authorProfileImage(post.getAuthor().getProfileImage())
                .title(post.getTitle())
                .content(post.getContent())
                .performanceDate(post.getPerformanceDate())
                .performanceTime(post.getPerformanceTime())
                .maxMembers(post.getMaxMembers())
                .currentMembers(post.getCurrentMembers())
                .seatInfo(post.getSeatInfo())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .participants(participants)
                .build();
    }

    public static CompanionPostResponse from(CompanionPost post, List<CompanionParticipantResponse> participants, Long chatRoomId) {
        return CompanionPostResponse.builder()
                .id(post.getId())
                .showId(post.getShow().getId())
                .showTitle(post.getShow().getTitle())
                .authorId(post.getAuthor().getId())
                .authorNickname(post.getAuthor().getNickname())
                .authorProfileImage(post.getAuthor().getProfileImage())
                .title(post.getTitle())
                .content(post.getContent())
                .performanceDate(post.getPerformanceDate())
                .performanceTime(post.getPerformanceTime())
                .maxMembers(post.getMaxMembers())
                .currentMembers(post.getCurrentMembers())
                .seatInfo(post.getSeatInfo())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .participants(participants)
                .chatRoomId(chatRoomId)
                .build();
    }
}
