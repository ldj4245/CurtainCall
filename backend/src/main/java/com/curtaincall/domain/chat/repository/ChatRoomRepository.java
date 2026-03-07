package com.curtaincall.domain.chat.repository;

import com.curtaincall.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByCompanionPostId(Long companionPostId);

    boolean existsByCompanionPostId(Long companionPostId);

    @Query("""
            SELECT cr FROM ChatRoom cr
            JOIN FETCH cr.companionPost cp
            JOIN cp.author a
            JOIN com.curtaincall.domain.companion.entity.CompanionParticipant p ON p.companionPost = cp
            WHERE p.user.id = :userId
            ORDER BY cr.createdAt DESC
            """)
    List<ChatRoom> findRoomsByUserId(@Param("userId") Long userId);
}
