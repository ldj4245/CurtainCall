package com.curtaincall.domain.showlive.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ShowLiveRoomDto {
    private Long roomId;
    private String showTitle;
    private String liveDate;
    private List<ShowLiveMessageDto> messages;
}
