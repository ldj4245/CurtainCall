package com.curtaincall.domain.casting.repository;

import com.curtaincall.domain.casting.entity.CastMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CastMemberRepository extends JpaRepository<CastMember, Long> {

    List<CastMember> findByShowIdOrderByIdAsc(Long showId);

    void deleteByShowId(Long showId);

    void deleteAllByShowIdIn(List<Long> showIds);

    boolean existsByShowId(Long showId);
}
