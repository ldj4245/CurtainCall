package com.curtaincall.domain.plan;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import java.util.*;

public interface ViewingPlanRepository extends JpaRepository<ViewingPlan, Long> {
    @EntityGraph(attributePaths = {"show", "show.theater"})
    List<ViewingPlan> findByUserIdOrderByWatchedDateAscWatchedTimeAsc(Long userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ViewingPlan p where p.id = :id and p.user.id = :userId")
    Optional<ViewingPlan> lockOwned(Long id, Long userId);
    List<ViewingPlan> findByUserIdAndDiaryId(Long userId, Long diaryId);
}
