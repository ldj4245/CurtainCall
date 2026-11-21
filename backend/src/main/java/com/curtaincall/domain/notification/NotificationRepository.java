package com.curtaincall.domain.notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    boolean existsByUserIdAndEventKey(Long userId, String eventKey);
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable page);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
}
