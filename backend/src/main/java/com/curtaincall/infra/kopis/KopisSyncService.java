package com.curtaincall.infra.kopis;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.theater.entity.Theater;
import com.curtaincall.domain.theater.repository.TheaterRepository;
import com.curtaincall.domain.casting.repository.CastMemberRepository;
import com.curtaincall.domain.showlive.repository.ShowLiveRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class KopisSyncService {

    private final KopisApiClient kopisApiClient;
    private final ShowRepository showRepository;
    private final TheaterRepository theaterRepository;
    private final CastMemberRepository castMemberRepository;
    private final ShowLiveRoomRepository showLiveRoomRepository;
    private final org.springframework.cache.CacheManager cacheManager;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter KST_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String[] GENRES = { "GGGA", "AAAA" }; // 뮤지컬, 연극

    private volatile String lastSyncTime = "미실행";
    private volatile String lastSyncStatus = "대기중";

    public String getLastSyncTime() {
        return lastSyncTime;
    }

    public String getLastSyncStatus() {
        return lastSyncStatus;
    }

    @Scheduled(cron = "0 0 4 * * *") // 매일 새벽 4시 (KST)
    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows", "popularShows" }, allEntries = true)
    public void syncShows() {
        log.info("KOPIS 공연 동기화 및 일일 유지보수 시작 (KST 새벽 4시)");
        lastSyncStatus = "진행중";
        LocalDate today = LocalDate.now();

        // 1. 공연 상태 자동 보정 (종료일 경과 -> ENDED, 시작일 도래 -> ONGOING)
        try {
            int endedCount = showRepository.updateEndedShows(today);
            int startedCount = showRepository.updateStartedShows(today);
            if (endedCount > 0 || startedCount > 0) {
                log.info("공연 상태 자동 갱신 완료: 공연종료 전환 {}건, 공연중 전환 {}건", endedCount, startedCount);
            }
        } catch (Exception e) {
            log.error("공연 상태 자동 갱신 실패: {}", e.getMessage());
        }

        // 2. KOPIS 신규/예정 공연 수집 (향후 3개월)
        LocalDate threeMonthsLater = today.plusMonths(3);
        int totalSynced = 0;
        for (String genre : GENRES) {
            try {
                List<KopisShowDto> shows = kopisApiClient.fetchShows(today.minusMonths(1), threeMonthsLater, genre);
                log.info("KOPIS 공연 목록 조회 완료 - genre: {}, count: {}", genre, shows.size());

                for (KopisShowDto showDto : shows) {
                    syncShow(showDto);
                    totalSynced++;
                }
            } catch (Exception e) {
                log.error("KOPIS 공연 동기화 실패 - genre: {}, error: {}", genre, e.getMessage());
            }
        }

        // 3. 5MB DB 용량 보호: 종료 후 30일 경과 & 미참조 공연 자동 정리
        try {
            int pruned = pruneOldEndedShows(30);
            if (pruned > 0) {
                log.info("DB 용량 보호를 위한 오래된 종료 공연 정리 완료: {}건 삭제", pruned);
            }
        } catch (Exception e) {
            log.warn("오래된 종료 공연 정리 중 오류 (무시): {}", e.getMessage());
        }

        lastSyncTime = ZonedDateTime.now(ZoneId.of("Asia/Seoul")).format(KST_FORMATTER);
        lastSyncStatus = "정상 완료 (" + totalSynced + "건 점검)";
        log.info("KOPIS 일일 유지보수 및 공연 동기화 완료: {}", lastSyncTime);
    }

    @Transactional
    public int pruneOldEndedShows(int daysAfterEnd) {
        LocalDate cutoff = LocalDate.now().minusDays(daysAfterEnd);
        List<Long> oldShowIds = showRepository.findOldUnreferencedEndedShowIds(cutoff, 100);
        if (oldShowIds.isEmpty()) {
            return 0;
        }
        log.info("5MB DB 용량 보호: 종료 후 {}일 경과한 미참조 공연 정리 시작 (대상: {}건)", daysAfterEnd, oldShowIds.size());
        castMemberRepository.deleteAllByShowIdIn(oldShowIds);
        showLiveRoomRepository.deleteAllByShowIdIn(oldShowIds);
        showRepository.deleteAllByIdInBatch(oldShowIds);
        return oldShowIds.size();
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

    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows", "popularShows" }, allEntries = true)
    public void manualSyncShows(int months) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusMonths(months);

        for (String genre : GENRES) {
            log.info("수동 동기화 - genre code: {}, period: {} ~ {}", genre, today.minusMonths(1), endDate);
            List<KopisShowDto> shows = kopisApiClient.fetchShows(today.minusMonths(1), endDate, genre);
            log.info("수동 동기화 - genre: {}, 조회된 공연 수: {}", genre, shows.size());
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
            LocalDate startDate = parseDate(detail.getStartDate());
            LocalDate endDate = parseDate(detail.getEndDate());
            Show.Status status = Show.Status.determineStatus(startDate, endDate, detail.getStatus());

            showRepository.findByKopisId(showDto.getKopisId())
                    .ifPresentOrElse(
                            existing -> existing.update(detail.getTitle(), genre, startDate, endDate,
                                    theater, detail.getPosterUrl(), detail.getCastInfo(),
                                    detail.getPriceInfo(), detail.getRuntime(), status,
                                    detail.getAgeLimit(), detail.getIntroImages(), detail.getDtguidance()),
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
                                    .dtguidance(detail.getDtguidance())
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
                .map(existing -> {
                    if (existing.getRegion() == null || existing.getRegion().isBlank()) {
                        enrichTheater(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    KopisTheaterDto theaterDetail = kopisApiClient.fetchTheaterDetail(detail.getTheaterKopisId());
                    if (theaterDetail != null) {
                        return theaterRepository.save(Theater.builder()
                                .kopisId(detail.getTheaterKopisId())
                                .name(theaterDetail.getName() != null ? theaterDetail.getName()
                                        : detail.getTheaterName())
                                .address(theaterDetail.getAddress())
                                .region(theaterDetail.getRegion())
                                .seatScale(theaterDetail.getSeatScale())
                                .characteristics(theaterDetail.getCharacteristics())
                                .build());
                    }
                    return theaterRepository.save(Theater.builder()
                            .kopisId(detail.getTheaterKopisId())
                            .name(detail.getTheaterName() != null ? detail.getTheaterName() : "미상")
                            .build());
                });
    }

    private void enrichTheater(Theater theater) {
        try {
            KopisTheaterDto detail = kopisApiClient.fetchTheaterDetail(theater.getKopisId());
            if (detail != null && detail.getAddress() != null) {
                String region = detail.getRegion();
                if (region == null || region.isBlank()) {
                    region = detail.getAddress().split(" ")[0];
                }

                theater.update(
                        detail.getName() != null ? detail.getName() : theater.getName(),
                        detail.getAddress(),
                        detail.getSeatScale(),
                        region,
                        detail.getCharacteristics());
                theaterRepository.save(theater);
                log.info("극장 지역 정보 업데이트 - {} → region: {}, address: {}",
                        theater.getName(), region, detail.getAddress());
            } else {
                log.warn("극장 상세 정보 없음 또는 주소 누락 - kopisId: {}, name: {}", theater.getKopisId(), theater.getName());
            }
        } catch (Exception e) {
            log.warn("극장 상세 조회 실패 - kopisId: {}, error: {}", theater.getKopisId(), e.getMessage());
        }
    }

    @Transactional
    public void enrichAllTheaterRegions() {
        List<Theater> theatersWithoutRegion = theaterRepository.findAll()
                .stream()
                .filter(t -> t.getRegion() == null || t.getRegion().isBlank())
                .toList();

        log.info("지역 정보 없는 극장 {} 건 보강 시작", theatersWithoutRegion.size());
        int updated = 0;
        for (Theater theater : theatersWithoutRegion) {
            enrichTheater(theater);
            updated++;
            if (updated % 50 == 0) {
                log.info("극장 보강 진행 중 - {}/{}", updated, theatersWithoutRegion.size());
            }
            try {
                Thread.sleep(300);
            } catch (InterruptedException ignored) {
            }
        }
        log.info("극장 지역 정보 보강 완료 - {} 건", updated);
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
        String clean = dateStr.trim().replace("-", ".").replace("/", ".");
        try {
            return LocalDate.parse(clean, DATE_FORMATTER);
        } catch (Exception e) {
            try {
                return LocalDate.parse(clean, DateTimeFormatter.ofPattern("yyyyMMdd"));
            } catch (Exception ex) {
                log.warn("날짜 파싱 실패: '{}'", dateStr);
                return null;
            }
        }
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void initSyncIfEmpty() {
        if (showRepository.count() == 0) {
            log.info("DB가 비어있습니다. 초기 데이터를 동기화합니다 (약 3~5분 소요)...");
            syncShows();

            if (cacheManager != null) {
                log.info("초기 동기화 완료 후 캐시를 비웁니다...");
                String[] cacheNames = { "showsSearch", "showDetail", "ongoingShows", "popularShows" };
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
