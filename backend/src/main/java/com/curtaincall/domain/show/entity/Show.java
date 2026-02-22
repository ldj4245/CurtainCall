package com.curtaincall.domain.show.entity;

import com.curtaincall.domain.theater.entity.Theater;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "shows")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Show extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kopis_id", unique = true, nullable = false, length = 20)
    private String kopisId;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Genre genre;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theater_id")
    private Theater theater;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(name = "cast_info", columnDefinition = "TEXT")
    private String castInfo;

    @Column(name = "price_info", columnDefinition = "TEXT")
    private String priceInfo;

    @Column(length = 50)
    private String runtime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ONGOING;

    @Column(name = "age_limit", length = 50)
    private String ageLimit;

    @Column(name = "intro_images", columnDefinition = "TEXT")
    private String introImages;

    public void update(String title, Genre genre, LocalDate startDate, LocalDate endDate,
            Theater theater, String posterUrl, String castInfo, String priceInfo,
            String runtime, Status status, String ageLimit, String introImages) {
        this.title = title;
        this.genre = genre;
        this.startDate = startDate;
        this.endDate = endDate;
        this.theater = theater;
        this.posterUrl = posterUrl;
        this.castInfo = castInfo;
        this.priceInfo = priceInfo;
        this.runtime = runtime;
        this.status = status;
        this.ageLimit = ageLimit;
        this.introImages = introImages;
    }

    public enum Genre {
        MUSICAL("뮤지컬"), PLAY("연극");

        private final String displayName;

        Genre(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static Genre fromKopis(String kopisGenre) {
            if (kopisGenre == null)
                return null;
            return switch (kopisGenre) {
                case "뮤지컬" -> MUSICAL;
                case "연극" -> PLAY;
                default -> null;
            };
        }
    }

    public enum Status {
        ONGOING("공연중"), ENDED("공연종료"), UPCOMING("공연예정");

        private final String displayName;

        Status(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static Status fromKopis(String kopisStatus) {
            if (kopisStatus == null)
                return ONGOING;
            return switch (kopisStatus) {
                case "공연중" -> ONGOING;
                case "공연완료" -> ENDED;
                case "공연예정" -> UPCOMING;
                default -> ONGOING;
            };
        }
    }
}
