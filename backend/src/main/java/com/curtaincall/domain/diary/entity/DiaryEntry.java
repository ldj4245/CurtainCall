package com.curtaincall.domain.diary.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "diary_entries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
@SQLDelete(sql = "UPDATE diary_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class DiaryEntry extends com.curtaincall.global.common.SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "watched_date", nullable = false)
    private LocalDate watchedDate;

    @Column(name = "seat_info", length = 100)
    private String seatInfo;

    @Column(name = "cast_memo", length = 500)
    private String castMemo;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "ticket_price")
    private Integer ticketPrice;

    @Column(name = "is_open", nullable = false)
    @Builder.Default
    private Boolean isOpen = false;

    public void update(LocalDate watchedDate, String seatInfo, String castMemo,
            Integer rating, String comment, Integer ticketPrice, Boolean isOpen) {
        this.watchedDate = watchedDate;
        this.seatInfo = seatInfo;
        this.castMemo = castMemo;
        this.rating = rating;
        this.comment = comment;
        this.ticketPrice = ticketPrice;
        this.isOpen = isOpen;
    }
}
