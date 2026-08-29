package com.curtaincall.domain.show.service;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.infra.kopis.KopisApiClient;
import com.curtaincall.infra.kopis.KopisShowDto;
import com.curtaincall.infra.kopis.KopisSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoxOfficeScheduler {

    private final KopisApiClient kopisApiClient;
    private final KopisSyncService kopisSyncService;
    private final ShowRepository showRepository;
    private final CacheManager cacheManager;

    /**
     * 서버 기동 완료 후 1회 박스오피스 순위 동기화 및 갱신
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        try {
            refreshBoxOffice();
        } catch (Exception e) {
            log.warn("서버 시작 시 박스오피스 갱신 실패 (무시): {}", e.getMessage());
        }
    }

    /**
     * 매일 오전 6시에 KOPIS 박스오피스를 가져와 인기 순위를 갱신합니다.
     */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void refreshBoxOffice() {
        log.info("=== KOPIS 박스오피스 인기 순위 갱신 시작 ===");

        // 오늘 날짜 기준 공연 상태 자동 보정 (종료일 경과 -> ENDED, 시작일 도래 -> ONGOING)
        java.time.LocalDate today = java.time.LocalDate.now();
        int endedCount = showRepository.updateEndedShows(today);
        int startedCount = showRepository.updateStartedShows(today);
        if (endedCount > 0 || startedCount > 0) {
            log.info("공연 상태 자동 갱신 완료: 공연종료 전환 {}건, 공연중 전환 {}건", endedCount, startedCount);
        }

        // 기존 모든 공연 순위 999로 초기화
        List<Show> allRanked = showRepository.findAll();
        for (Show s : allRanked) {
            if (s.getPopularityRank() != null && s.getPopularityRank() < 999) {
                s.updatePopularityRank(999);
            }
        }

        List<String> musicalRanking = kopisApiClient.fetchBoxOffice("GGGA", "");
        List<String> playRanking = kopisApiClient.fetchBoxOffice("AAAA", "");

        log.info("KOPIS 박스오피스 응답: 뮤지컬 {}건, 연극 {}건", musicalRanking.size(), playRanking.size());

        // 뮤지컬 상위 20개 순위 부여 (DB에 없으면 상세 조회하여 즉시 저장)
        int musicalCount = Math.min(20, musicalRanking.size());
        for (int i = 0; i < musicalCount; i++) {
            String kopisId = musicalRanking.get(i);
            int rank = i + 1;
            Show show = showRepository.findByKopisId(kopisId).orElse(null);
            if (show == null) {
                try {
                    kopisSyncService.syncShow(KopisShowDto.builder().kopisId(kopisId).build());
                    show = showRepository.findByKopisId(kopisId).orElse(null);
                } catch (Exception e) {
                    log.warn("뮤지컬 동기화 실패 (kopisId: {}): {}", kopisId, e.getMessage());
                }
            }
            if (show != null) {
                show.updatePopularityRank(rank);
                log.info("뮤지컬 인기 #{}: {} ({})", rank, show.getTitle(), kopisId);
            }
        }

        // 연극 상위 20개 순위 부여 (DB에 없으면 상세 조회하여 즉시 저장)
        int playCount = Math.min(20, playRanking.size());
        for (int i = 0; i < playCount; i++) {
            String kopisId = playRanking.get(i);
            int rank = i + 1;
            Show show = showRepository.findByKopisId(kopisId).orElse(null);
            if (show == null) {
                try {
                    kopisSyncService.syncShow(KopisShowDto.builder().kopisId(kopisId).build());
                    show = showRepository.findByKopisId(kopisId).orElse(null);
                } catch (Exception e) {
                    log.warn("연극 동기화 실패 (kopisId: {}): {}", kopisId, e.getMessage());
                }
            }
            if (show != null) {
                show.updatePopularityRank(rank);
                log.info("연극 인기 #{}: {} ({})", rank, show.getTitle(), kopisId);
            }
        }

        clearPopularShowsCache();
        log.info("=== KOPIS 박스오피스 인기 순위 갱신 완료 (뮤지컬 {}건, 연극 {}건 반영) ===",
                musicalCount, playCount);
    }

    private void clearPopularShowsCache() {
        if (cacheManager != null) {
            String[] caches = { "popularShows", "homeShowSections", "ongoingShows", "showsSearch" };
            for (String name : caches) {
                Cache cache = cacheManager.getCache(name);
                if (cache != null) {
                    cache.clear();
                }
            }
        }
    }
}
