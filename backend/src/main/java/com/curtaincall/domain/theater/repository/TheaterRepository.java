package com.curtaincall.domain.theater.repository;

import com.curtaincall.domain.theater.entity.Theater;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TheaterRepository extends JpaRepository<Theater, Long> {
    Optional<Theater> findByKopisId(String kopisId);
}
