package com.curtaincall.domain.chat.entity;

import com.curtaincall.domain.companion.entity.CompanionPost;
import com.curtaincall.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "companion_post_id", nullable = false, unique = true)
    private CompanionPost companionPost;

    public static ChatRoom of(CompanionPost post) {
        return ChatRoom.builder()
                .companionPost(post)
                .build();
    }
}
