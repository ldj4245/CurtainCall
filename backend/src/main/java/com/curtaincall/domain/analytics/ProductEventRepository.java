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

    interface EventCount {
        String getName();
        long getCount();
    }
}
