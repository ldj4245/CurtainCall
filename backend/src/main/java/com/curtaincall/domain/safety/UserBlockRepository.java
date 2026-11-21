package com.curtaincall.domain.safety;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    List<UserBlock> findByUserId(Long userId);
    boolean existsByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
    void deleteByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
}
