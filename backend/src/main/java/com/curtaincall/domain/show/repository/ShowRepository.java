package com.curtaincall.domain.show.repository;

import com.curtaincall.domain.show.entity.Show;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShowRepository extends JpaRepository<Show, Long>, ShowRepositoryCustom {

    Optional<Show> findByKopisId(String kopisId);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t WHERE s.status = :status ORDER BY s.startDate DESC")
    Page<Show> findByStatusWithTheater(@Param("status") Show.Status status, Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t WHERE s.genre = :genre ORDER BY s.startDate DESC")
    Page<Show> findByGenreWithTheater(@Param("genre") Show.Genre genre, Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t ORDER BY s.startDate DESC")
    Page<Show> findAllWithTheater(Pageable pageable);

    @Query("SELECT s FROM Show s WHERE s.status = 'ONGOING' ORDER BY s.id DESC")
    List<Show> findTop10ByStatusOngoing(Pageable pageable);

    List<Show> findByStatus(Show.Status status);
}
