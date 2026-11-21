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
    private Boolean hasSpoiler;
    private String comment;
    private String representativeImageUrl;
    private List<String> photoUrls;

    public static DiarySnippetItemDto from(DiaryEntry entry) {
        List<String> photos = PhotoUrls.read(entry.getPhotoUrls());
        String representativeImage = photos.isEmpty()
                ? null
                : photos.get(0);

        return DiarySnippetItemDto.builder()
                .diaryId(entry.getId())
                .userNickname(entry.getUser() != null ? entry.getUser().getNickname() : "관객")
                .watchedDate(entry.getWatchedDate())
                .seatInfo(entry.getSeatInfo())
                .castMemo(entry.getCastMemo())
                .rating(entry.getRating())
                .hasSpoiler(entry.getHasSpoiler())
                .comment(entry.getComment())
                .representativeImageUrl(representativeImage)
                .photoUrls(photos)
                .build();
    }

}
