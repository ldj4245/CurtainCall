package com.curtaincall.domain.showlive.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "show_live_rooms",
        uniqueConstraints = @UniqueConstraint(columnNames = {"show_id", "live_date"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ShowLiveRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "live_date", nullable = false)
    private LocalDate liveDate;

    public static ShowLiveRoom of(Show show, LocalDate liveDate) {
        return ShowLiveRoom.builder()
                .show(show)
                .liveDate(liveDate)
                .build();
    }
}
