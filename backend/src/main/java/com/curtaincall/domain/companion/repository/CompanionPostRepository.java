package com.curtaincall.domain.companion.repository;

import com.curtaincall.domain.companion.entity.CompanionPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanionPostRepository extends JpaRepository<CompanionPost, Long> {

    // 공연별 동행 모집글 조회. 시간이 임박한 게 먼저, 그 다음이 작성일 역순 등 정렬은 Pageable에서 처리.
    Page<CompanionPost> findByShowId(Long showId, Pageable pageable);

    // 열려있는 모집글만 조회 (마감 제외)
    Page<CompanionPost> findByShowIdAndStatus(Long showId, CompanionPost.Status status, Pageable pageable);
}
