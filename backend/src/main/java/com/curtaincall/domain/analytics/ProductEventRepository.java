package com.curtaincall.domain.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {
    List<ProductEvent> findByCreatedAtAfter(LocalDateTime after);
    long countBySessionIdAndCreatedAtAfter(String session, LocalDateTime after);
    void deleteByCreatedAtBefore(LocalDateTime before);

    @Query("SELECT e.name AS name, COUNT(e.id) AS count FROM ProductEvent e WHERE e.createdAt > :after GROUP BY e.name")
    List<EventCount> countByNameAfter(@Param("after") LocalDateTime after);

    @Query("SELECT COUNT(DISTINCT e.sessionId) FROM ProductEvent e WHERE e.createdAt >= :since")
    long countDistinctSessionsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e.id) FROM ProductEvent e WHERE e.name = :name AND e.createdAt >= :since")
    long countByNameSince(@Param("name") String name, @Param("since") LocalDateTime since);

    @Query("SELECT e.createdAt AS createdAt, e.sessionId AS sessionId, e.name AS name FROM ProductEvent e WHERE e.createdAt >= :since")
    List<RecentEvent> findRecentEventsSince(@Param("since") LocalDateTime since);

    interface EventCount {
        String getName();
        long getCount();
    }

    interface RecentEvent {
        LocalDateTime getCreatedAt();
        String getSessionId();
        String getName();
    }
}
