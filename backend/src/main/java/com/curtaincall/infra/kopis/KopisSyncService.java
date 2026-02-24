package com.curtaincall.infra.kopis;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.theater.entity.Theater;
import com.curtaincall.domain.theater.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KopisSyncService {

    private final KopisApiClient kopisApiClient;
    private final ShowRepository showRepository;
    private final TheaterRepository theaterRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final String[] GENRES = { "GGGA", "AAAA" }; // 뮤지컬, 연극

    @Scheduled(cron = "0 0 2 * * *") // 매일 새벽 2시
    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows" }, allEntries = true)
    public void syncShows() {
        log.info("KOPIS 공연 동기화 시작");

        LocalDate today = LocalDate.now();
        LocalDate threeMonthsLater = today.plusMonths(3);

        for (String genre : GENRES) {
            try {
                List<KopisShowDto> shows = kopisApiClient.fetchShows(today.minusMonths(1), threeMonthsLater, genre);
                log.info("KOPIS 공연 목록 조회 완료 - genre: {}, count: {}", genre, shows.size());

                for (KopisShowDto showDto : shows) {
                    syncShow(showDto);
                }
            } catch (Exception e) {
                log.error("KOPIS 공연 동기화 실패 - genre: {}, error: {}", genre, e.getMessage());
            }
        }

        log.info("KOPIS 공연 동기화 완료");
    }

    @Scheduled(cron = "0 0 3 * * MON") // 매주 월요일 새벽 3시
    @Transactional
    public void syncTheaters() {
        log.info("KOPIS 극장 동기화 시작");

        List<KopisTheaterDto> theaters = kopisApiClient.fetchTheaters();
        log.info("KOPIS 극장 목록 조회 완료 - count: {}", theaters.size());

        for (KopisTheaterDto theaterDto : theaters) {
            syncTheater(theaterDto);
        }

        log.info("KOPIS 극장 동기화 완료");
    }

    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows" }, allEntries = true)
    public void manualSyncShows(int months) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusMonths(months);

        for (String genre : GENRES) {
            log.info("수동 동기화 - genre code: {}, period: {} ~ {}", genre, today.minusMonths(1), endDate);
            List<KopisShowDto> shows = kopisApiClient.fetchShows(today.minusMonths(1), endDate, genre);
            log.info("수동 동기화 - genre: {}, 조회된 공연 수: {}", genre, shows.size());
            if (!shows.isEmpty()) {
                log.info("첫 번째 공연 - kopisId: {}, title: {}, genre: {}",
                        shows.get(0).getKopisId(), shows.get(0).getTitle(), shows.get(0).getGenre());
            }
            for (KopisShowDto showDto : shows) {
                syncShow(showDto);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncShow(KopisShowDto showDto) {
        try {
            KopisShowDetailDto detail = kopisApiClient.fetchShowDetail(showDto.getKopisId());
            if (detail == null)
                return;

            Theater theater = findOrCreateTheater(detail);
            Show.Genre genre = Show.Genre.fromKopis(detail.getGenre());
            if (genre == null) {
                log.warn("알 수 없는 장르 - kopisId: {}, genrenm: '{}', title: {}",
                        showDto.getKopisId(), detail.getGenre(), detail.getTitle());
            }
            Show.Status status = Show.Status.fromKopis(detail.getStatus());
            LocalDate startDate = parseDate(detail.getStartDate());
            LocalDate endDate = parseDate(detail.getEndDate());

            showRepository.findByKopisId(showDto.getKopisId())
                    .ifPresentOrElse(
                            existing -> existing.update(detail.getTitle(), genre, startDate, endDate,
                                    theater, detail.getPosterUrl(), detail.getCastInfo(),
                                    detail.getPriceInfo(), detail.getRuntime(), status,
                                    detail.getAgeLimit(), detail.getIntroImages()),
                            () -> showRepository.save(Show.builder()
                                    .kopisId(showDto.getKopisId())
                                    .title(detail.getTitle())
                                    .genre(genre)
                                    .startDate(startDate)
                                    .endDate(endDate)
                                    .theater(theater)
                                    .posterUrl(detail.getPosterUrl())
                                    .castInfo(detail.getCastInfo())
                                    .priceInfo(detail.getPriceInfo())
                                    .runtime(detail.getRuntime())
                                    .ageLimit(detail.getAgeLimit())
                                    .introImages(detail.getIntroImages())
                                    .status(status)
                                    .build()));
        } catch (Exception e) {
            log.error("공연 저장 실패 - kopisId: {}, error: {}", showDto.getKopisId(), e.getMessage());
        }
    }

    private Theater findOrCreateTheater(KopisShowDetailDto detail) {
        if (detail.getTheaterKopisId() == null)
            return null;
        return theaterRepository.findByKopisId(detail.getTheaterKopisId())
                .orElseGet(() -> theaterRepository.save(Theater.builder()
                        .kopisId(detail.getTheaterKopisId())
                        .name(detail.getTheaterName() != null ? detail.getTheaterName() : "미상")
                        .build()));
    }

    private void syncTheater(KopisTheaterDto dto) {
        theaterRepository.findByKopisId(dto.getKopisId())
                .ifPresentOrElse(
                        existing -> existing.update(dto.getName(), dto.getAddress(),
                                dto.getSeatScale(), dto.getRegion(), dto.getCharacteristics()),
                        () -> theaterRepository.save(Theater.builder()
                                .kopisId(dto.getKopisId())
                                .name(dto.getName())
                                .address(dto.getAddress())
                                .seatScale(dto.getSeatScale())
                                .region(dto.getRegion())
                                .characteristics(dto.getCharacteristics())
                                .build()));
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank())
            return null;
        try {
            return LocalDate.parse(dateStr, DATE_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }

    private final org.springframework.cache.CacheManager cacheManager;

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initSyncIfEmpty() {
        if (showRepository.count() == 0) {
            log.info("DB가 비어있습니다. 초기 데이터를 동기화합니다 (약 3~5분 소요)...");
            syncShows();

            // 캐시 명시적 초기화 (내부 호출로 인한 @CacheEvict 무시 우회)
            if (cacheManager != null) {
                log.info("초기 동기화 완료 후 캐시를 비웁니다...");
                String[] cacheNames = { "showsSearch", "showDetail", "ongoingShows" };
                for (String cacheName : cacheNames) {
                    org.springframework.cache.Cache cache = cacheManager.getCache(cacheName);
                    if (cache != null) {
                        cache.clear();
                    }
                }
            }
        }
    }
}
