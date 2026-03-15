package com.curtaincall.domain.diary.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DiarySnippetResponse {

    private long totalCount;
    private long seatRecordCount;
    private List<DiarySnippetItemDto> items;
}
