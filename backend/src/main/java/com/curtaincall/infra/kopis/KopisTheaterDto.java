package com.curtaincall.infra.kopis;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KopisTheaterDto {
    private String kopisId;
    private String name;
    private String region;
    private String address;
    private Integer seatScale;
    private String characteristics;
}
