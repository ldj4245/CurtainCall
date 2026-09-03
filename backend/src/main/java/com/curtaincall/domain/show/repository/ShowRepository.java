package com.curtaincall.domain.show.repository;

import com.curtaincall.domain.show.entity.Show;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

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

    @Query("SELECT s FROM Show s JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.popularityRank IS NOT NULL AND s.popularityRank < 999 ORDER BY s.popularityRank ASC")
    List<Show> findPopularOngoing(Pageable pageable);

    @Query("SELECT s FROM Show s JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.genre = :genre AND s.popularityRank IS NOT NULL AND s.popularityRank < 999 ORDER BY s.popularityRank ASC")
    List<Show> findPopularOngoingByGenre(@Param("genre") Show.Genre genre, Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = :status AND s.genre = :genre ORDER BY s.startDate DESC")
    List<Show> findByGenreAndStatusWithTheaterList(@Param("genre") Show.Genre genre, @Param("status") Show.Status status, Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.endDate >= CURRENT_DATE ORDER BY s.endDate ASC")
    List<Show> findEndingSoon(Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.startDate BETWEEN :startDate AND :endDate ORDER BY s.startDate ASC")
    List<Show> findOpeningBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.id IN :ids")
    List<Show> findAllByIdInWithTheater(@Param("ids") List<Long> ids);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = :status ORDER BY s.id DESC")
    List<Show> findByStatusWithTheaterList(@Param("status") Show.Status status, Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater ORDER BY s.id DESC")
    List<Show> findAllWithTheaterList(Pageable pageable);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.startDate <= :date AND s.endDate >= :date ORDER BY s.popularityRank ASC")
    List<Show> findOngoingShowsOnDate(@Param("date") LocalDate date);

    @Query("SELECT s FROM Show s LEFT JOIN FETCH s.theater WHERE s.status = 'ONGOING' AND s.genre = :genre AND s.startDate <= :date AND s.endDate >= :date ORDER BY s.popularityRank ASC")
    List<Show> findOngoingShowsOnDateAndGenre(@Param("date") LocalDate date, @Param("genre") Show.Genre genre);

    @Modifying
    @Query("UPDATE Show s SET s.status = 'ENDED' WHERE s.status = 'ONGOING' AND s.endDate < :today")
    int updateEndedShows(@Param("today") LocalDate today);

    @Modifying
    @Query("UPDATE Show s SET s.status = 'ONGOING' WHERE s.status = 'UPCOMING' AND s.startDate <= :today AND (s.endDate IS NULL OR s.endDate >= :today)")
    int updateStartedShows(@Param("today") LocalDate today);

    long countByStatus(Show.Status status);

    @Query(value = "SELECT s.id FROM shows s " +
           "WHERE s.status = 'ENDED' AND s.end_date < :cutoffDate " +
           "AND NOT EXISTS (SELECT 1 FROM diary_entries d WHERE d.show_id = s.id) " +
           "AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.show_id = s.id) " +
           "AND NOT EXISTS (SELECT 1 FROM favorite_shows f WHERE f.show_id = s.id) " +
           "AND NOT EXISTS (SELECT 1 FROM companion_posts c WHERE c.show_id = s.id) " +
           "LIMIT :limit", nativeQuery = true)
    List<Long> findOldUnreferencedEndedShowIds(@Param("cutoffDate") LocalDate cutoffDate, @Param("limit") int limit);

    List<Show> findByStatus(Show.Status status);
}
