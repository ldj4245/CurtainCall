package com.curtaincall.domain.review.repository;

import com.curtaincall.domain.review.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {
    Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, Long userId);
    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

    @Query("SELECT rl.review.id FROM ReviewLike rl WHERE rl.review.id IN :reviewIds AND rl.user.id = :userId")
    Set<Long> findLikedReviewIds(@Param("reviewIds") List<Long> reviewIds, @Param("userId") Long userId);
}
