package com.curtaincall.domain.showlive.repository;

import com.curtaincall.domain.showlive.entity.ShowLiveMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShowLiveMessageRepository extends JpaRepository<ShowLiveMessage, Long> {

    @Query("""
            SELECT m FROM ShowLiveMessage m
            JOIN FETCH m.sender
            WHERE m.room.id = :roomId
            ORDER BY m.createdAt ASC
            """)
    List<ShowLiveMessage> findTop50ByRoomId(@Param("roomId") Long roomId,
                                             org.springframework.data.domain.Pageable pageable);
}
