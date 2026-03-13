package com.curtaincall.domain.companion.repository;

import com.curtaincall.domain.companion.entity.CompanionPost;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanionPostRepository extends JpaRepository<CompanionPost, Long> {

    @Query(value = "SELECT cp FROM CompanionPost cp JOIN FETCH cp.show JOIN FETCH cp.author WHERE cp.show.id = :showId",
            countQuery = "SELECT COUNT(cp) FROM CompanionPost cp WHERE cp.show.id = :showId")
    Page<CompanionPost> findByShowId(@Param("showId") Long showId, Pageable pageable);

    @Query(value = "SELECT cp FROM CompanionPost cp JOIN FETCH cp.show JOIN FETCH cp.author WHERE cp.show.id = :showId AND cp.status = :status",
            countQuery = "SELECT COUNT(cp) FROM CompanionPost cp WHERE cp.show.id = :showId AND cp.status = :status")
    Page<CompanionPost> findByShowIdAndStatus(
            @Param("showId") Long showId,
            @Param("status") CompanionPost.Status status,
            Pageable pageable
    );

    @Query(value = "SELECT cp FROM CompanionPost cp JOIN FETCH cp.show JOIN FETCH cp.author WHERE cp.status = :status",
            countQuery = "SELECT COUNT(cp) FROM CompanionPost cp WHERE cp.status = :status")
    Page<CompanionPost> findByStatus(@Param("status") CompanionPost.Status status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cp FROM CompanionPost cp JOIN FETCH cp.author WHERE cp.id = :postId")
    Optional<CompanionPost> findByIdForUpdate(@Param("postId") Long postId);
}
