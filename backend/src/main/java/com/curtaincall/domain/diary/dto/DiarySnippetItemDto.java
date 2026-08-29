package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.diary.entity.DiaryEntry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Getter
@Builder
public class DiarySnippetItemDto {

    private Long diaryId;
    private String userNickname;
    private LocalDate watchedDate;
    private String seatInfo;
    private String castMemo;
    private Integer rating;
    private String comment;
    private String representativeImageUrl;
    private List<String> photoUrls;

    public static DiarySnippetItemDto from(DiaryEntry entry) {
        List<String> photos = parsePhotoUrls(entry.getPhotoUrls());
        String representativeImage = photos.isEmpty()
                ? (entry.getShow() != null ? entry.getShow().getPosterUrl() : null)
                : photos.get(0);

        return DiarySnippetItemDto.builder()
                .diaryId(entry.getId())
                .userNickname(entry.getUser() != null ? entry.getUser().getNickname() : "관객")
                .watchedDate(entry.getWatchedDate())
                .seatInfo(entry.getSeatInfo())
                .castMemo(entry.getCastMemo())
                .rating(entry.getRating())
                .comment(entry.getComment())
                .representativeImageUrl(representativeImage)
                .photoUrls(photos)
                .build();
    }

    private static List<String> parsePhotoUrls(String photoUrls) {
        if (photoUrls == null || photoUrls.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(photoUrls.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
