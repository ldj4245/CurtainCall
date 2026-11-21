package com.curtaincall.domain.plan;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity @Table(name = "viewing_plans", indexes = @Index(columnList = "user_id,watchedDate"))
@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class ViewingPlan extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(nullable = false) private Show show;
    @Column(nullable = false) private LocalDate watchedDate;
    private LocalTime watchedTime;
    @Column(length = 100) private String seatInfo;
    @Column(length = 500) private String memo;
    @Builder.Default @Column(nullable = false) private boolean reminder = false;
    private Long diaryId;
    public void update(LocalDate date, LocalTime time, String seat, String note, boolean remind) {
        watchedDate = date; watchedTime = time; seatInfo = seat; memo = note; reminder = remind;
    }
    public void complete(Long entryId) { diaryId = entryId; }
}
