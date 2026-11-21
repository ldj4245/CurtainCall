package com.curtaincall.domain.analytics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
public interface ProductEventRepository extends JpaRepository<ProductEvent, Long> {
    java.util.List<ProductEvent> findByCreatedAtAfter(LocalDateTime after);
    long countBySessionIdAndCreatedAtAfter(String session, LocalDateTime after);
    void deleteByCreatedAtBefore(LocalDateTime before);
}
