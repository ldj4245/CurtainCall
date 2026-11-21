package com.curtaincall.infra.kopis;

import com.curtaincall.domain.casting.repository.CastMemberRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.showlive.repository.ShowLiveRoomRepository;
import com.curtaincall.domain.theater.RegionNormalizer;
import com.curtaincall.domain.theater.entity.Theater;
import com.curtaincall.domain.theater.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KopisSyncService {

    private final KopisApiClient kopisApiClient;
    private final ShowRepository showRepository;
    private final TheaterRepository theaterRepository;
    private final CastMemberRepository castMemberRepository;
    private final ShowLiveRoomRepository showLiveRoomRepository;
    private final CacheManager cacheManager;
    private final TransactionTemplate transactionTemplate;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter KST_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String[] GENRES = { "GGGA", "AAAA" }; // 뮤지컬, 연극
    private static final String[] SHOW_CACHE_NAMES = {
            "showsSearch", "showDetail", "ongoingShows", "popularShows", "homeShowSections", "todaySchedule"
    };

    private volatile String lastSyncTime = "미실행";
    private volatile String lastSyncStatus = "대기중";

    public String getLastSyncTime() {
        return lastSyncTime;
    }

    public String getLastSyncStatus() {
        return lastSyncStatus;
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul") // 매일 새벽 4시 (KST)
    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows", "popularShows", "homeShowSections", "todaySchedule" }, allEntries = true)
    public void syncShows() {
        syncShows(3);
    }

    public void syncShows(int months) {
        log.info("KOPIS 공연 동기화 및 일일 유지보수 시작 ({}개월 범위, KST)", months);
        lastSyncStatus = "진행중";
        LocalDate today = LocalDate.now(KST);

        // 1. 공연 상태 자동 보정 (종료일 경과 -> ENDED, 시작일 도래 -> ONGOING)
        try {
            transactionTemplate.executeWithoutResult(status -> {
                int endedCount = showRepository.updateEndedShows(today);
                int startedCount = showRepository.updateStartedShows(today);
                if (endedCount > 0 || startedCount > 0) {
                    log.info("공연 상태 자동 갱신 완료: 공연종료 전환 {}건, 공연중 전환 {}건", endedCount, startedCount);
                }
            });
        } catch (Exception e) {
            log.error("공연 상태 자동 갱신 실패: {}", e.getMessage());
        }

        // 2. KOPIS 공연 수집
        LocalDate rangeEnd = today.plusMonths(months);
        int totalSynced = 0;
        int failedGenres = 0;
        for (String genre : GENRES) {
            try {
                List<KopisShowDto> shows = kopisApiClient.fetchShows(today.minusMonths(1), rangeEnd, genre);
                log.info("KOPIS 공연 목록 조회 완료 - genre: {}, count: {}", genre, shows.size());

                for (KopisShowDto showDto : shows) {
                    syncShow(showDto);
                    totalSynced++;
                }
            } catch (Exception e) {
                failedGenres++;
                log.error("KOPIS 공연 동기화 실패 - genre: {}, error: {}", genre, e.getMessage());
            }
        }

        // 3. 종료 후 180일 경과 & 미참조 공연 자동 정리
        try {
            int pruned = pruneOldEndedShows(180);
            if (pruned > 0) {
                log.info("오래된 미참조 종료 공연 정리 완료: {}건 삭제", pruned);
            }
        } catch (Exception e) {
            log.warn("오래된 종료 공연 정리 중 오류 (무시): {}", e.getMessage());
        }

        clearShowCaches();
        lastSyncTime = ZonedDateTime.now(KST).format(KST_FORMATTER);
        lastSyncStatus = failedGenres > 0
                ? "부분 실패 (" + failedGenres + "개 장르, " + totalSynced + "건 반영)"
                : "정상 완료 (" + totalSynced + "건 점검)";
        log.info("KOPIS 일일 유지보수 및 공연 동기화 완료: {}", lastSyncTime);
    }

    public int pruneOldEndedShows(int daysAfterEnd) {
        LocalDate cutoff = LocalDate.now(KST).minusDays(daysAfterEnd);
        Integer deleted = transactionTemplate.execute(status -> {
            List<Long> oldShowIds = showRepository.findOldUnreferencedEndedShowIds(cutoff, 100);
            if (oldShowIds.isEmpty()) {
                return 0;
            }
            log.info("종료 후 {}일 경과한 미참조 공연 정리 시작 (대상: {}건)", daysAfterEnd, oldShowIds.size());
            castMemberRepository.deleteAllByShowIdIn(oldShowIds);
            showLiveRoomRepository.deleteAllByShowIdIn(oldShowIds);
            showRepository.deleteAllByIdInBatch(oldShowIds);
            return oldShowIds.size();
        });
        int count = deleted != null ? deleted : 0;
        if (count > 0) {
            clearShowCaches();
        }
        return count;
    }

    @Scheduled(cron = "0 30 2 * * MON", zone = "Asia/Seoul") // 매주 월요일 새벽 2시 30분
    public void syncTheaters() {
        log.info("KOPIS 극장 동기화 시작");

        List<KopisTheaterDto> theaters = kopisApiClient.fetchTheaters();
        log.info("KOPIS 극장 목록 조회 완료 - count: {}", theaters.size());

        for (KopisTheaterDto theaterDto : theaters) {
            try {
                transactionTemplate.executeWithoutResult(status -> syncTheater(theaterDto));
            } catch (Exception e) {
                log.warn("극장 저장 실패 - kopisId: {}, error: {}", theaterDto.getKopisId(), e.getMessage());
            }
        }

        clearShowCaches();
        log.info("KOPIS 극장 동기화 완료");
    }

    @CacheEvict(value = { "showsSearch", "showDetail", "ongoingShows", "popularShows", "homeShowSections", "todaySchedule" }, allEntries = true)
    public void manualSyncShows(int months) {
        syncShows(months);
    }

    public void syncShow(KopisShowDto showDto) {
        try {
            KopisShowDetailDto detail = kopisApiClient.fetchShowDetail(showDto.getKopisId());
            if (detail == null) {
                return;
            }

            KopisTheaterDto fetchedTheaterDetail = null;
            if (detail.getTheaterKopisId() != null) {
                Optional<Theater> existingTheater = theaterRepository.findByKopisId(detail.getTheaterKopisId());
                if (existingTheater.isEmpty()
                        || existingTheater.get().getAddress() == null
                        || existingTheater.get().getAddress().isBlank()) {
                    fetchedTheaterDetail = kopisApiClient.fetchTheaterDetail(detail.getTheaterKopisId());
                }
            }

            final KopisTheaterDto theaterSnapshot = fetchedTheaterDetail;
            transactionTemplate.executeWithoutResult(tx -> {
                Theater theater = resolveTheaterInTx(detail, theaterSnapshot);
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
                                        detail.getAgeLimit(), detail.getIntroImages(), detail.getDtguidance(),
                                        detail.getBookingLinks()),
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
                                        .bookingLinks(detail.getBookingLinks())
                                        .status(status)
                                        .build()));
            });
        } catch (Exception e) {
            log.error("공연 저장 실패 - kopisId: {}, error: {}", showDto.getKopisId(), e.getMessage());
        }
    }

    private Theater resolveTheaterInTx(KopisShowDetailDto detail, KopisTheaterDto fetchedDetail) {
        if (detail.getTheaterKopisId() == null) {
            return null;
        }
        return theaterRepository.findByKopisId(detail.getTheaterKopisId())
                .map(existing -> {
                    if ((existing.getAddress() == null || existing.getAddress().isBlank()) && fetchedDetail != null) {
                        applyTheaterDetails(existing, fetchedDetail, detail.getArea());
                    } else {
                        String normalized = normalizeTheaterRegion(
                                existing.getRegion(), existing.getAddress(), detail.getArea());
                        if (normalized != null && !normalized.equals(existing.getRegion())) {
                            existing.update(existing.getName(), existing.getAddress(),
                                    existing.getSeatScale(), normalized, existing.getCharacteristics());
                            theaterRepository.save(existing);
                        }
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    if (fetchedDetail != null) {
                        String region = normalizeTheaterRegion(
                                fetchedDetail.getRegion(), fetchedDetail.getAddress(), detail.getArea());
                        return theaterRepository.save(Theater.builder()
                                .kopisId(detail.getTheaterKopisId())
                                .name(fetchedDetail.getName() != null ? fetchedDetail.getName()
                                        : detail.getTheaterName())
                                .address(fetchedDetail.getAddress())
                                .region(region)
                                .seatScale(fetchedDetail.getSeatScale())
                                .characteristics(fetchedDetail.getCharacteristics())
                                .build());
                    }
                    return theaterRepository.save(Theater.builder()
                            .kopisId(detail.getTheaterKopisId())
                            .name(detail.getTheaterName() != null ? detail.getTheaterName() : "미상")
                            .region(RegionNormalizer.normalize(detail.getArea(), null))
                            .build());
                });
    }

    private void applyTheaterDetails(Theater theater, KopisTheaterDto detail, String fallbackArea) {
        if (detail == null || (detail.getAddress() == null && detail.getRegion() == null && fallbackArea == null)) {
            return;
        }
        String region = normalizeTheaterRegion(detail.getRegion(), detail.getAddress(), fallbackArea);
        theater.update(
                detail.getName() != null ? detail.getName() : theater.getName(),
                detail.getAddress() != null ? detail.getAddress() : theater.getAddress(),
                detail.getSeatScale() != null ? detail.getSeatScale() : theater.getSeatScale(),
                region,
                detail.getCharacteristics() != null ? detail.getCharacteristics() : theater.getCharacteristics());
        theaterRepository.save(theater);
        log.info("극장 지역 정보 업데이트 - {} → region: {}", theater.getName(), region);
    }

    private String normalizeTheaterRegion(String rawRegion, String address, String fallbackArea) {
        String normalized = RegionNormalizer.normalize(rawRegion, address);
        return normalized != null ? normalized : RegionNormalizer.normalize(fallbackArea, null);
    }

    public void normalizeExistingTheaterRegions() {
        Integer updated = transactionTemplate.execute(status -> {
            int count = 0;
            for (Theater theater : theaterRepository.findAll()) {
                String normalized = RegionNormalizer.normalize(theater.getRegion(), theater.getAddress());
                if (normalized != null && !normalized.equals(theater.getRegion())) {
                    theater.update(
                            theater.getName(),
                            theater.getAddress(),
                            theater.getSeatScale(),
                            normalized,
                            theater.getCharacteristics());
                    theaterRepository.save(theater);
                    count++;
                }
            }
            return count;
        });
        if (updated != null && updated > 0) {
            log.info("기존 극장 {}건 지역명 정규화 완료", updated);
            clearShowCaches();
        }
    }

    public void backfillMissingBookingLinks() {
        List<Show> targets = showRepository.findByBookingLinksIsNullAndStatusIn(
                List.of(Show.Status.ONGOING, Show.Status.UPCOMING))
                .stream()
                .limit(100)
                .toList();
        if (targets.isEmpty()) {
            return;
        }
        log.info("공식 예매처 링크 보강 시작: {}건", targets.size());
        int updated = 0;
        for (Show target : targets) {
            KopisShowDetailDto detail = kopisApiClient.fetchShowDetail(target.getKopisId());
            if (detail == null) {
                continue;
            }
            String linksJson = detail.getBookingLinks() != null ? detail.getBookingLinks() : "[]";
            transactionTemplate.executeWithoutResult(status -> showRepository.findById(target.getId()).ifPresent(managed -> {
                managed.updateBookingLinks(linksJson);
                if (managed.getTheater() != null
                        && (managed.getTheater().getRegion() == null || managed.getTheater().getRegion().isBlank())) {
                    String region = normalizeTheaterRegion(
                            managed.getTheater().getRegion(), managed.getTheater().getAddress(), detail.getArea());
                    if (region != null) {
                        Theater t = managed.getTheater();
                        t.update(t.getName(), t.getAddress(), t.getSeatScale(), region, t.getCharacteristics());
                    }
                }
            }));
            updated++;
        }
        if (updated > 0) {
            log.info("공식 예매처 링크 보강 완료: {}건", updated);
            clearShowCaches();
        }
    }

    private void clearShowCaches() {
        if (cacheManager == null) {
            return;
        }
        for (String cacheName : SHOW_CACHE_NAMES) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
    }

    public void enrichAllTheaterRegions() {
        List<Theater> theatersWithoutRegion = theaterRepository.findAll()
                .stream()
                .filter(t -> t.getRegion() == null || t.getRegion().isBlank())
                .toList();

        log.info("지역 정보 없는 극장 {} 건 보강 시작", theatersWithoutRegion.size());
        int updated = 0;
        for (Theater theater : theatersWithoutRegion) {
            KopisTheaterDto detail = kopisApiClient.fetchTheaterDetail(theater.getKopisId());
            if (detail != null) {
                transactionTemplate.executeWithoutResult(status ->
                        theaterRepository.findById(theater.getId()).ifPresent(managed ->
                                applyTheaterDetails(managed, detail, null)));
            }
            updated++;
            if (updated % 50 == 0) {
                log.info("극장 보강 진행 중 - {}/{}", updated, theatersWithoutRegion.size());
            }
            try {
                Thread.sleep(300);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        if (updated > 0) {
            clearShowCaches();
        }
        log.info("극장 지역 정보 보강 완료 - {} 건", updated);
    }

    private void syncTheater(KopisTheaterDto dto) {
        String normalizedRegion = RegionNormalizer.normalize(dto.getRegion(), dto.getAddress());
        theaterRepository.findByKopisId(dto.getKopisId())
                .ifPresentOrElse(
                        existing -> existing.update(dto.getName(), dto.getAddress(),
                                dto.getSeatScale(), normalizedRegion, dto.getCharacteristics()),
                        () -> theaterRepository.save(Theater.builder()
                                .kopisId(dto.getKopisId())
                                .name(dto.getName())
                                .address(dto.getAddress())
                                .seatScale(dto.getSeatScale())
                                .region(normalizedRegion)
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

    public void initSyncIfEmpty() {
        if (showRepository.count() == 0) {
            log.info("DB가 비어있습니다. 초기 데이터를 동기화합니다...");
            syncShows(3);
        }
    }
}
