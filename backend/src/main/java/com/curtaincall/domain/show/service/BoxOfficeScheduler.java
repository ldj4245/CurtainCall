package com.curtaincall.domain.show.service;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.infra.kopis.KopisApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoxOfficeScheduler {

    private final KopisApiClient kopisApiClient;
    private final ShowRepository showRepository;
    private final CacheManager cacheManager;

    /**
     * 서버 완전히 뜬 후 최초 1회 박스오피스 갱신
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
        log.info("=== 박스오피스 인기 순위 갱신 시작 ===");

        List<Show> allShows = showRepository.findByStatus(Show.Status.ONGOING);
        allShows.forEach(show -> show.updatePopularityRank(999));

        List<String> musicalRanking = kopisApiClient.fetchBoxOffice("GGGA", "");
        List<String> playRanking = kopisApiClient.fetchBoxOffice("AAAA", "");

        List<String> allKopisIds = new ArrayList<>(musicalRanking);
        allKopisIds.addAll(playRanking);

        Map<String, Show> showByKopisId = showRepository.findAllByKopisIdIn(allKopisIds).stream()
                .collect(Collectors.toMap(Show::getKopisId, s -> s));

        int rank = 1;
        for (String kopisId : musicalRanking) {
            Show show = showByKopisId.get(kopisId);
            if (show != null) {
                show.updatePopularityRank(rank);
                log.info("인기 #{}: {} ({})", rank, show.getTitle(), kopisId);
            }
            rank++;
        }
        for (String kopisId : playRanking) {
            Show show = showByKopisId.get(kopisId);
            if (show != null) {
                show.updatePopularityRank(rank);
            }
            rank++;
        }

        clearPopularShowsCache();
        log.info("=== 박스오피스 인기 순위 갱신 완료 (뮤지컬 {}건, 연극 {}건) ===",
                musicalRanking.size(), playRanking.size());
    }

    private void clearPopularShowsCache() {
        Cache cache = cacheManager.getCache("popularShows");
        if (cache != null) {
            cache.clear();
        }
    }
}
