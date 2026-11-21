package com.curtaincall.domain.analytics;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "product_events", indexes = {@Index(columnList = "sessionId,createdAt"), @Index(columnList = "name,createdAt")})
@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductEvent extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 40) private String name;
    @Column(nullable = false, length = 36) private String sessionId;
    private Long userId;
    private Long showId;
}
