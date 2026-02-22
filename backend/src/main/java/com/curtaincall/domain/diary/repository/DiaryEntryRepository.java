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

    Page<DiaryEntry> findByUserIdOrderByWatchedDateDesc(Long userId, Pageable pageable);

    Optional<DiaryEntry> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT d FROM DiaryEntry d JOIN FETCH d.show s JOIN FETCH d.user u " +
            "WHERE d.user.id = :userId ORDER BY d.watchedDate DESC")
    List<DiaryEntry> findAllByUserIdWithShow(@Param("userId") Long userId);

    long countByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(d.ticketPrice), 0) FROM DiaryEntry d WHERE d.user.id = :userId AND d.ticketPrice IS NOT NULL")
    Long sumTicketPriceByUserId(@Param("userId") Long userId);

    List<DiaryEntry> findByUserIdAndWatchedDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
