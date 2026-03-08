package com.curtaincall.domain.companion.repository;

import com.curtaincall.domain.companion.entity.CompanionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanionParticipantRepository extends JpaRepository<CompanionParticipant, Long> {

    List<CompanionParticipant> findByCompanionPostId(Long postId);

    List<CompanionParticipant> findByCompanionPostIdIn(List<Long> postIds);

    Optional<CompanionParticipant> findByCompanionPostIdAndUserId(Long postId, Long userId);

    boolean existsByCompanionPostIdAndUserId(Long postId, Long userId);

    @Modifying
    @Query("DELETE FROM CompanionParticipant p WHERE p.companionPost.id = :postId")
    void deleteByCompanionPostId(@Param("postId") Long postId);
}
