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
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoxOfficeScheduler {

    private volatile String lastRankStatus = "미실행";
    private volatile String lastRankSuccess = "확인되지 않음";
    public String getLastRankStatus() { return lastRankStatus; }
    public String getLastRankSuccess() { return lastRankSuccess; }

    private final KopisApiClient kopisApiClient;
    private final KopisSyncService kopisSyncService;
    private final ShowRepository showRepository;
    private final CacheManager cacheManager;
    private final TransactionTemplate transactionTemplate;
    private final Environment environment;

    /**
     * 서버 기동 완료 후 1회 박스오피스 순위 동기화 및 갱신
     */
    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        if (environment.acceptsProfiles(Profiles.of("test"))) {
            return;
        }
        boolean emptyAtBoot = showRepository.count() == 0;
        CompletableFuture.runAsync(() -> {
            try {
                refreshBoxOffice();
            } catch (Exception e) {
                log.warn("서버 시작 시 박스오피스 갱신 실패 (무시): {}", e.getMessage());
            }
            if (emptyAtBoot) {
                try {
                    kopisSyncService.syncShows();
                    clearPopularShowsCache();
                } catch (Exception e) {
                    log.warn("서버 시작 시 전체 공연 동기화 실패 (무시): {}", e.getMessage());
                }
            }
            try {
                kopisSyncService.normalizeExistingTheaterRegions();
            } catch (Exception e) {
                log.warn("서버 시작 시 극장 지역 정규화 실패 (무시): {}", e.getMessage());
            }
            try {
                kopisSyncService.backfillMissingBookingLinks();
            } catch (Exception e) {
                log.warn("서버 시작 시 공식 예매처 링크 보강 실패 (무시): {}", e.getMessage());
            }
        });
    }

    /**
     * 매일 오전 6시에 KOPIS 박스오피스를 가져와 인기 순위를 갱신합니다.
     */
    @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Seoul")
    public void refreshBoxOffice() {
        log.info("=== KOPIS 박스오피스 인기 순위 갱신 시작 ===");

        // 1. 짧은 트랜잭션으로 오늘 날짜 기준 공연 상태 보정 후 즉시 커밋(락 해제)
        java.time.LocalDate today = java.time.LocalDate.now();
        transactionTemplate.executeWithoutResult(status -> {
            int endedCount = showRepository.updateEndedShows(today);
            int startedCount = showRepository.updateStartedShows(today);
            if (endedCount > 0 || startedCount > 0) {
                log.info("공연 상태 자동 갱신 완료: 공연종료 전환 {}건, 공연중 전환 {}건", endedCount, startedCount);
            }
        });

        // 2. 외부 KOPIS 박스오피스 조회 (트랜잭션 밖)
        List<String> musicalRanking = kopisApiClient.fetchBoxOffice("GGGA", "");
        List<String> playRanking = kopisApiClient.fetchBoxOffice("AAAA", "");
        if (musicalRanking.isEmpty() || playRanking.isEmpty()) {
            lastRankStatus = "갱신 실패 · 마지막 정상 데이터 유지";
            log.warn("순위 응답이 비어 있어 마지막 정상 순위를 유지합니다.");
            return;
        }

        log.info("KOPIS 박스오피스 응답: 뮤지컬 {}건, 연극 {}건", musicalRanking.size(), playRanking.size());

        int musicalCount = Math.min(20, musicalRanking.size());
        for (int i = 0; i < musicalCount; i++) {
            String kopisId = musicalRanking.get(i);
            if (showRepository.findByKopisId(kopisId).isEmpty()) {
                try {
                    kopisSyncService.syncShow(KopisShowDto.builder().kopisId(kopisId).build());
                } catch (Exception e) {
                    log.warn("뮤지컬 동기화 실패 (kopisId: {}): {}", kopisId, e.getMessage());
                }
            }
        }

        int playCount = Math.min(20, playRanking.size());
        for (int i = 0; i < playCount; i++) {
            String kopisId = playRanking.get(i);
            if (showRepository.findByKopisId(kopisId).isEmpty()) {
                try {
                    kopisSyncService.syncShow(KopisShowDto.builder().kopisId(kopisId).build());
                } catch (Exception e) {
                    log.warn("연극 동기화 실패 (kopisId: {}): {}", kopisId, e.getMessage());
                }
            }
        }

        // 3. 짧은 트랜잭션으로 순위 일괄 갱신
        transactionTemplate.executeWithoutResult(status -> {
            List<Show> allRanked = showRepository.findAll();
            for (Show s : allRanked) {
                if (s.getPopularityRank() != null && s.getPopularityRank() < 999) {
                    s.updatePopularityRank(999);
                }
            }

            for (int i = 0; i < musicalCount; i++) {
                String kopisId = musicalRanking.get(i);
                int rank = i + 1;
                showRepository.findByKopisId(kopisId).ifPresent(show -> {
                    show.updatePopularityRank(rank);
                    log.info("뮤지컬 인기 #{}: {} ({})", rank, show.getTitle(), kopisId);
                });
            }

            for (int i = 0; i < playCount; i++) {
                String kopisId = playRanking.get(i);
                int rank = i + 1;
                showRepository.findByKopisId(kopisId).ifPresent(show -> {
                    show.updatePopularityRank(rank);
                    log.info("연극 인기 #{}: {} ({})", rank, show.getTitle(), kopisId);
                });
            }
        });

        clearPopularShowsCache();
        lastRankStatus = "정상 완료";
        lastRankSuccess = java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Seoul")).toString();
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
