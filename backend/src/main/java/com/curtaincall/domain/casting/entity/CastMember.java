package com.curtaincall.domain.casting.entity;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cast_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "show_id", "role_name", "actor_name" })
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CastMember extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "show_id", nullable = false)
    private Show show;

    @Column(name = "role_name", length = 100)
    private String roleName;

    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;

    @Column(name = "actor_image_url", length = 500)
    private String actorImageUrl;

    @Column(name = "playdb_id", length = 20)
    private String playdbId;

    public void updateImageUrl(String actorImageUrl) {
        this.actorImageUrl = actorImageUrl;
    }
}
