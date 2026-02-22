package com.curtaincall.domain.theater.dto;

import com.curtaincall.domain.theater.entity.Theater;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TheaterResponse {
    private Long id;
    private String kopisId;
    private String name;
    private String address;
    private Integer seatScale;
    private String region;
    private String characteristics;

    public static TheaterResponse from(Theater theater) {
        return TheaterResponse.builder()
                .id(theater.getId())
                .kopisId(theater.getKopisId())
                .name(theater.getName())
                .address(theater.getAddress())
                .seatScale(theater.getSeatScale())
                .region(theater.getRegion())
                .characteristics(theater.getCharacteristics())
                .build();
    }
}
