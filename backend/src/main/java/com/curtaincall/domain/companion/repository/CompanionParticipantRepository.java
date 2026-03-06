package com.curtaincall.domain.companion.repository;

import com.curtaincall.domain.companion.entity.CompanionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanionParticipantRepository extends JpaRepository<CompanionParticipant, Long> {

    List<CompanionParticipant> findByCompanionPostId(Long postId);

    Optional<CompanionParticipant> findByCompanionPostIdAndUserId(Long postId, Long userId);

    boolean existsByCompanionPostIdAndUserId(Long postId, Long userId);
}
