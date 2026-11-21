package com.curtaincall.domain.notification;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "notifications", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "eventKey"}))
@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 120) private String eventKey;
    @Column(nullable = false, length = 300) private String title;
    @Column(nullable = false, length = 200) private String path;
    private boolean seen;
    public void markSeen() { seen = true; }
}
