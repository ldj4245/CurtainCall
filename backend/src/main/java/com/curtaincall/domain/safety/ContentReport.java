package com.curtaincall.domain.safety;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "content_reports") @Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class ContentReport extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long reporterId;
    @Column(nullable = false) private Long authorId;
    @Column(nullable = false, length = 20) private String targetType;
    @Column(nullable = false) private Long targetId;
    @Column(nullable = false, length = 500) private String reason;
    @Column(nullable = false, length = 2000) private String evidence;
    @Builder.Default @Column(nullable = false, length = 20) private String status = "OPEN";
    public void resolve(String state) { status = state; }
}
