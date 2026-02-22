package com.curtaincall.domain.review.repository;

import com.curtaincall.domain.review.entity.ReviewComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    // 최상위 댓글만 조회 (parent가 null인 것)
    Page<ReviewComment> findByReviewIdAndParentIsNullOrderByCreatedAtAsc(Long reviewId, Pageable pageable);

    Optional<ReviewComment> findByIdAndUserId(Long id, Long userId);

    long countByReviewId(Long reviewId);
}
