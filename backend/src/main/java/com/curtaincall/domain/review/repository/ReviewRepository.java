package com.curtaincall.domain.review.repository;

import com.curtaincall.domain.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"user", "show"})
    Page<Review> findByShowIdOrderByCreatedAtDesc(Long showId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "show"})
    Page<Review> findByShowIdOrderByLikeCountDesc(Long showId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "show"})
    Optional<Review> findByIdAndUserId(Long id, Long userId);

    boolean existsByShowIdAndUserId(Long showId, Long userId);

    @Query("SELECT AVG((r.storyScore + r.castScore + r.directionScore + r.soundScore) / 4.0) FROM Review r WHERE r.show.id = :showId")
    Double getAverageScoreByShowId(@Param("showId") Long showId);

    long countByShowId(Long showId);

    @EntityGraph(attributePaths = {"user", "show"})
    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
