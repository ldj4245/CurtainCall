package com.curtaincall.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "social_accounts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Provider provider;

    @Column(name = "provider_id", nullable = false, length = 100)
    private String providerId;

    public enum Provider {
        KAKAO, NAVER, GOOGLE
    }
}
