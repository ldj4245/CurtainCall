package com.curtaincall.domain.diary.dto;

import com.curtaincall.domain.diary.entity.DiaryEntry;
import com.curtaincall.domain.diary.entity.DiaryEntrySource;
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
    private Integer rating;
    private String comment;
    private String seatInfo;
    private Integer viewRating;
    private DiaryEntrySource entrySource;
    private String representativeImageUrl;

    public static DiarySnippetItemDto from(DiaryEntry entry) {
        List<String> photos = parsePhotoUrls(entry.getPhotoUrls());
        String representativeImage = photos.isEmpty()
                ? entry.getShow().getPosterUrl()
                : photos.get(0);

        return DiarySnippetItemDto.builder()
                .diaryId(entry.getId())
                .userNickname(entry.getUser().getNickname())
                .watchedDate(entry.getWatchedDate())
                .rating(entry.getRating())
                .comment(entry.getComment())
                .seatInfo(entry.getSeatInfo())
                .viewRating(entry.getViewRating())
                .entrySource(entry.getEntrySource())
                .representativeImageUrl(representativeImage)
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
