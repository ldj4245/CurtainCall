package com.curtaincall.domain.review.repository;

import com.curtaincall.domain.review.entity.ReviewComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    Page<ReviewComment> findByReviewIdAndParentIsNullOrderByCreatedAtAsc(Long reviewId, Pageable pageable);

    Optional<ReviewComment> findByIdAndUserId(Long id, Long userId);

    long countByReviewId(Long reviewId);

    @Query("SELECT c.review.id as reviewId, COUNT(c) as count FROM ReviewComment c WHERE c.review.id IN :reviewIds GROUP BY c.review.id")
    List<CommentCountProjection> countByReviewIds(@Param("reviewIds") List<Long> reviewIds);

    interface CommentCountProjection {
        Long getReviewId();
        Long getCount();
    }
}
