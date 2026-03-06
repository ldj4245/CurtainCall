package com.curtaincall.domain.casting.service;

import com.curtaincall.domain.casting.dto.CastingResponse;
import com.curtaincall.domain.casting.entity.CastMember;
import com.curtaincall.domain.casting.repository.CastMemberRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CastingService {

    private final CastMemberRepository castMemberRepository;
    private final ShowRepository showRepository;
    private final PlaydbCrawlerService playdbCrawlerService;

    public List<CastingResponse> getCastingByShow(Long showId) {
        List<CastMember> members = castMemberRepository.findByShowIdOrderByIdAsc(showId);

        // DB에 캐스팅 정보가 없으면 PlayDB에서 크롤링 시도
        if (members.isEmpty()) {
            Show show = showRepository.findById(showId).orElse(null);
            if (show != null) {
                try {
                    refreshCastingForShow(show);
                    members = castMemberRepository.findByShowIdOrderByIdAsc(showId);
                } catch (Exception e) {
                    log.warn("캐스팅 크롤링 실패 (showId={}): {}", showId, e.getMessage());
                }
            }
        }

        return CastingResponse.from(members);
    }

    @Transactional
    public void refreshCasting(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공연입니다."));
        refreshCastingForShow(show);
    }

    @Transactional
    public void refreshCastingForShow(Show show) {
        List<CastMember> crawled = playdbCrawlerService.crawlCasting(show);
        if (!crawled.isEmpty()) {
            castMemberRepository.deleteByShowId(show.getId());
            castMemberRepository.saveAll(crawled);
            log.info("캐스팅 정보 갱신 완료: {} ({}명)", show.getTitle(), crawled.size());
        }
    }
}
