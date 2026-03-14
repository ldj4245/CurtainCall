package com.curtaincall.domain.casting.service;

import com.curtaincall.domain.casting.dto.CastingResponse;
import com.curtaincall.domain.casting.entity.CastMember;
import com.curtaincall.domain.casting.repository.CastMemberRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CastingService {

    private final CastMemberRepository castMemberRepository;
    private final ShowRepository showRepository;
    private final PlaydbCrawlerService playdbCrawlerService;

    @Transactional(readOnly = true)
    public List<CastingResponse> getCastingByShow(Long showId) {
        showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));
        List<CastMember> members = castMemberRepository.findByShowIdOrderByIdAsc(showId);
        return CastingResponse.from(members);
    }

    @Transactional
    public void refreshCasting(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));
        refreshCastingForShow(show);
    }

    @Transactional
    public void refreshCastingForShow(Show show) {
        // 1. 기존 데이터 삭제
        castMemberRepository.deleteByShowId(show.getId());
        castMemberRepository.flush(); // 삭제 즉시 반영

        // 2. 크롤링
        List<CastMember> crawled = playdbCrawlerService.crawlCasting(show);

        // 3. 저장
        if (!crawled.isEmpty()) {
            castMemberRepository.saveAll(crawled);
            log.info("캐스팅 정보 갱신 완료: {} ({}명)", show.getTitle(), crawled.size());
        } else {
            log.warn("캐스팅 크롤링 결과 없음: {}", show.getTitle());
        }
    }

}
