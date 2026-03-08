package com.curtaincall.domain.chat.repository;

import com.curtaincall.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            SELECT m FROM ChatMessage m
            JOIN FETCH m.sender
            WHERE m.room.id = :roomId
            ORDER BY m.createdAt ASC
            """)
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(@Param("roomId") Long roomId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.room.id = :roomId")
    void deleteByRoomId(@Param("roomId") Long roomId);
}
