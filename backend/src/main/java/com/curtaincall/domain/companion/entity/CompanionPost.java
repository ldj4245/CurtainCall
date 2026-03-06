package com.curtaincall.domain.companion.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "companion_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CompanionPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "performance_date", nullable = false)
    private LocalDate performanceDate;

    @Column(name = "performance_time", nullable = false, length = 50)
    private String performanceTime;

    @Column(name = "max_members", nullable = false)
    private int maxMembers;

    @Column(name = "current_members", nullable = false)
    @Builder.Default
    private int currentMembers = 1;

    @Column(name = "seat_info", length = 100)
    private String seatInfo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.OPEN;

    public void incrementMembers() {
        this.currentMembers++;
        if (this.currentMembers >= this.maxMembers) {
            this.status = Status.CLOSED;
        }
    }

    public void decrementMembers() {
        if (this.currentMembers > 1) {
            this.currentMembers--;
        }
        if (this.currentMembers < this.maxMembers && this.status == Status.CLOSED) {
            this.status = Status.OPEN;
        }
    }

    public void markAsClosed() {
        this.status = Status.CLOSED;
    }

    public void markAsExpired() {
        this.status = Status.EXPIRED;
    }

    public boolean isFull() {
        return this.currentMembers >= this.maxMembers;
    }

    public enum Status {
        OPEN, CLOSED, EXPIRED
    }
}
