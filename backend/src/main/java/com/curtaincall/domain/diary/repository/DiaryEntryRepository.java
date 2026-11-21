package com.curtaincall.domain.diary.repository;

import com.curtaincall.domain.diary.entity.DiaryEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DiaryEntryRepository extends JpaRepository<DiaryEntry, Long>, DiaryEntryRepositoryCustom {

    Optional<DiaryEntry> findByShareTokenAndIsOpenTrue(String token);

    @Query("SELECT COUNT(d.rating) AS ratingCount, AVG(d.rating) AS averageRating FROM DiaryEntry d WHERE d.show.id = :showId AND d.isOpen = true")
    PublicRatings publicRatings(Long showId);
    interface PublicRatings { long getRatingCount(); Double getAverageRating(); }

    @Query(value = "SELECT d FROM DiaryEntry d JOIN FETCH d.show s JOIN FETCH d.user u WHERE d.show.id = :showId AND d.isOpen = true AND (:seatsOnly = false OR (d.seatInfo IS NOT NULL AND TRIM(d.seatInfo) <> '')) AND (:seat = '' OR LOWER(d.seatInfo) LIKE LOWER(CONCAT('%', :seat, '%'))) ORDER BY d.watchedDate DESC, d.id DESC",
           countQuery = "SELECT COUNT(d) FROM DiaryEntry d WHERE d.show.id = :showId AND d.isOpen = true AND (:seatsOnly = false OR (d.seatInfo IS NOT NULL AND TRIM(d.seatInfo) <> '')) AND (:seat = '' OR LOWER(d.seatInfo) LIKE LOWER(CONCAT('%', :seat, '%')))")
    Page<DiaryEntry> findPublicRecords(Long showId, boolean seatsOnly, String seat, Pageable pageable);

    @Query(value = "SELECT d FROM DiaryEntry d JOIN FETCH d.show s LEFT JOIN FETCH s.theater WHERE d.user.id = :userId ORDER BY d.watchedDate DESC",
           countQuery = "SELECT COUNT(d) FROM DiaryEntry d WHERE d.user.id = :userId")
    Page<DiaryEntry> findByUserIdOrderByWatchedDateDesc(@Param("userId") Long userId, Pageable pageable);

    Optional<DiaryEntry> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT d FROM DiaryEntry d JOIN FETCH d.show s JOIN FETCH d.user u " +
            "WHERE d.user.id = :userId ORDER BY d.watchedDate DESC")
    List<DiaryEntry> findAllByUserIdWithShow(@Param("userId") Long userId);

    @Query("SELECT d FROM DiaryEntry d JOIN FETCH d.show s JOIN FETCH d.user u " +
            "WHERE d.show.id = :showId AND d.isOpen = true ORDER BY d.watchedDate DESC")
    List<DiaryEntry> findPublicByShowId(@Param("showId") Long showId);

    @Query(value = "SELECT d FROM DiaryEntry d JOIN FETCH d.show s JOIN FETCH d.user u " +
            "WHERE d.show.id = :showId AND d.isOpen = true ORDER BY d.watchedDate DESC, d.createdAt DESC",
            countQuery = "SELECT COUNT(d) FROM DiaryEntry d WHERE d.show.id = :showId AND d.isOpen = true")
    Page<DiaryEntry> findPublicPageByShowId(@Param("showId") Long showId, Pageable pageable);

    long countByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(d.ticketPrice), 0) FROM DiaryEntry d WHERE d.user.id = :userId AND d.ticketPrice IS NOT NULL")
    Long sumTicketPriceByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM DiaryEntry d JOIN FETCH d.show s LEFT JOIN FETCH s.theater WHERE d.user.id = :userId AND d.watchedDate BETWEEN :startDate AND :endDate ORDER BY d.watchedDate ASC")
    List<DiaryEntry> findByUserIdAndWatchedDateBetween(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT d.show.id AS showId, COUNT(d.id) AS recordCount " +
            "FROM DiaryEntry d GROUP BY d.show.id ORDER BY COUNT(d.id) DESC")
    List<ShowRecordCount> findMostRecordedShowIds(Pageable pageable);

    interface ShowRecordCount {
        Long getShowId();
        Long getRecordCount();
    }
}
