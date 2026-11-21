package com.curtaincall.domain.safety;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {
    Page<ContentReport> findAllByOrderByCreatedAtDesc(Pageable page);
    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(Long user, String type, Long target, String status);
}
