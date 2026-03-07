package com.curtaincall.domain.show.service;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.infra.kopis.KopisApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoxOfficeScheduler {

    private final KopisApiClient kopisApiClient;
    private final ShowRepository showRepository;

    /**
     * 매일 오전 6시에 KOPIS 박스오피스를 가져와 인기 순위를 갱신합니다.
     */
    @Scheduled(cron = "0 0 6 * * *")
    @Transactional
    public void refreshBoxOffice() {
        log.info("=== 박스오피스 인기 순위 갱신 시작 ===");

        // 기존 모든 ONGOING 순위 초기화 (순위 밖 공연은 999)
        List<Show> allShows = showRepository.findByStatus(Show.Status.ONGOING);
        allShows.forEach(show -> show.updatePopularityRank(999));

        // 뮤지컬 박스오피스 TOP 조회
        List<String> musicalRanking = kopisApiClient.fetchBoxOffice("GGGA", "");
        AtomicInteger rank = new AtomicInteger(1);

        for (String kopisId : musicalRanking) {
            int currentRank = rank.getAndIncrement();
            showRepository.findByKopisId(kopisId).ifPresent(show -> {
                show.updatePopularityRank(currentRank);
                log.info("인기 #{}: {} ({})", currentRank, show.getTitle(), kopisId);
            });
        }

        // 연극 박스오피스도 추가
        List<String> playRanking = kopisApiClient.fetchBoxOffice("AAAA", "");
        for (String kopisId : playRanking) {
            int currentRank = rank.getAndIncrement();
            showRepository.findByKopisId(kopisId).ifPresent(show -> {
                show.updatePopularityRank(currentRank);
            });
        }

        log.info("=== 박스오피스 인기 순위 갱신 완료 (뮤지컬 {}건, 연극 {}건) ===",
                musicalRanking.size(), playRanking.size());
    }
}
