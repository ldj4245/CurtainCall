package com.curtaincall.domain.showlive.repository;

import com.curtaincall.domain.showlive.entity.ShowLiveRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ShowLiveRoomRepository extends JpaRepository<ShowLiveRoom, Long> {
    Optional<ShowLiveRoom> findByShowIdAndLiveDate(Long showId, LocalDate liveDate);
}
