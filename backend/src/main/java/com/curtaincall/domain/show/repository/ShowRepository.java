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

    List<Show> findAllByKopisIdIn(List<String> kopisIds);

    @Query("SELECT s FROM Show s WHERE s.title LIKE %:keyword% ORDER BY s.popularityRank ASC")
    List<Show> findByTitleContaining(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t WHERE s.status = :status ORDER BY s.startDate DESC")
    Page<Show> findByStatusWithTheater(@Param("status") Show.Status status, Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t WHERE s.genre = :genre ORDER BY s.startDate DESC")
    Page<Show> findByGenreWithTheater(@Param("genre") Show.Genre genre, Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater t ORDER BY s.startDate DESC")
    Page<Show> findAllWithTheater(Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.endDate >= CURRENT_DATE ORDER BY s.endDate ASC")
    List<Show> findTop10ByStatusOngoing(Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.popularityRank < 999 ORDER BY s.popularityRank ASC")
    List<Show> findPopularOngoing(Pageable pageable);

    List<Show> findByStatus(Show.Status status);
}
