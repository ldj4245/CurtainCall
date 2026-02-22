package com.curtaincall.domain.theater.entity;

import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "theaters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Theater extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kopis_id", unique = true, nullable = false, length = 20)
    private String kopisId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String address;

    @Column(name = "seat_scale")
    private Integer seatScale;

    @Column(length = 50)
    private String region;

    @Column(name = "characteristics", length = 200)
    private String characteristics;

    public void update(String name, String address, Integer seatScale, String region, String characteristics) {
        this.name = name;
        this.address = address;
        this.seatScale = seatScale;
        this.region = region;
        this.characteristics = characteristics;
    }
}
