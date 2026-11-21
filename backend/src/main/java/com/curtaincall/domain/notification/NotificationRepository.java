package com.curtaincall.domain.notification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    boolean existsByUserIdAndEventKey(Long userId, String eventKey);

    @Query("SELECT n.eventKey FROM Notification n WHERE n.userId = :userId AND n.eventKey IN :keys")
    Set<String> findExistingEventKeys(@Param("userId") Long userId, @Param("keys") Collection<String> keys);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable page);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);
}
