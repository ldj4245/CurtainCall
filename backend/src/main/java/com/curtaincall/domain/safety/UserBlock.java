package com.curtaincall.domain.safety;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "user_blocks", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "blockedUserId"}))
@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserBlock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false) private Long blockedUserId;
}
