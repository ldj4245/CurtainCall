package com.curtaincall.domain.casting.config;

import com.curtaincall.domain.casting.service.CastingService;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 매일 새벽 3시에 현재 공연 중인 공연들의 캐스팅 정보를 갱신합니다.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class CastingScheduleConfig {

    private final ShowRepository showRepository;
    private final CastingService castingService;

    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void refreshOngoingShowsCasting() {
        log.info("===== 캐스팅 정보 갱신 시작 =====");

        List<Show> ongoingShows = showRepository.findByStatus(Show.Status.ONGOING);
        int success = 0;
        int fail = 0;

        for (Show show : ongoingShows) {
            try {
                castingService.refreshCastingForShow(show);
                success++;
                Thread.sleep(3000); // 공연 간 3초 딜레이
            } catch (Exception e) {
                fail++;
                log.warn("캐스팅 갱신 실패: {} - {}", show.getTitle(), e.getMessage());
            }
        }

        log.info("===== 캐스팅 정보 갱신 완료: 성공 {}건 / 실패 {}건 =====", success, fail);
    }
}
