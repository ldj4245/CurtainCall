package com.curtaincall.domain.show.service;

import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.review.repository.ReviewRepository;
import com.curtaincall.domain.show.dto.ShowAutocompleteResponse;
import com.curtaincall.domain.show.dto.ShowHomeSectionsResponse;
import com.curtaincall.domain.show.dto.ShowResponse;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import com.curtaincall.domain.show.dto.ShowScheduleResponse;
import com.curtaincall.domain.theater.RegionNormalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_HOME_LIMIT = 20;

    private final ShowRepository showRepository;
    private final ReviewRepository reviewRepository;
    private final DiaryEntryRepository diaryEntryRepository;
    private final com.curtaincall.infra.kopis.KopisSyncService kopisSyncService;

    @Cacheable(value = "showsSearch", key = "{#keyword, #genre, #status, #region, #page, #size}")
    public Page<ShowResponse> searchShows(String keyword, String genre, String status, String region, int page,
            int size) {
        Pageable pageable = PageRequest.of(safePage(page), safeSize(size, MAX_PAGE_SIZE));
        Show.Genre genreEnum = parseEnum(Show.Genre.class, genre);
        Show.Status statusEnum = parseEnum(Show.Status.class, status);

        return showRepository.searchShows(keyword, genreEnum, statusEnum, region, pageable)
                .map(ShowResponse::from);
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public ShowResponse getShow(Long id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));

        Double averageScore = reviewRepository.getAverageScoreByShowId(id);
        long reviewCount = reviewRepository.countByShowId(id);

        var ratings = diaryEntryRepository.publicRatings(id);
        long diaryRatings = ratings == null ? 0 : ratings.getRatingCount();
        long count = reviewCount + diaryRatings;
        double sum = (averageScore == null ? 0 : averageScore * reviewCount) + (diaryRatings == 0 || ratings.getAverageRating() == null ? 0 : ratings.getAverageRating() * diaryRatings);
        return ShowResponse.fromWithStats(show, count == 0 ? null : Math.round(sum / count * 10.0) / 10.0, reviewCount).withRatingCount(count);
    }

    @Cacheable(value = "ongoingShows", key = "#limit")
    public List<ShowResponse> getOngoingShows(int limit) {
        Pageable pageable = PageRequest.of(0, safeSize(limit, MAX_HOME_LIMIT));
        return showRepository.findTop10ByStatusOngoing(pageable)
                .stream().map(ShowResponse::from).toList();
    }

    @Cacheable(value = "popularShows", key = "{#limit, #genre}")
    public List<ShowResponse> getPopularShows(int limit, String genre) {
        Pageable pageable = PageRequest.of(0, safeSize(limit, MAX_HOME_LIMIT));
        Show.Genre genreEnum = parseEnum(Show.Genre.class, genre);

        List<Show> shows;
        if (genreEnum != null) {
            shows = showRepository.findPopularOngoingByGenre(genreEnum, pageable);
            if (shows.isEmpty()) {
                shows = showRepository.findByGenreAndStatusWithTheaterList(genreEnum, Show.Status.ONGOING, pageable);
            }
        } else {
            shows = showRepository.findPopularOngoing(pageable);
            if (shows.isEmpty()) {
                shows = showRepository.findByStatusWithTheaterList(Show.Status.ONGOING, pageable);
            }
        }
        return shows.stream().map(ShowResponse::from).toList();
    }

    @Cacheable(value = "homeShowSections", key = "#limit")
    public ShowHomeSectionsResponse getHomeSections(int limit) {
        int size = safeSize(limit, MAX_HOME_LIMIT);
        Pageable pageable = PageRequest.of(0, size);
        YearMonth thisMonth = YearMonth.now();
        LocalDate monthStart = thisMonth.atDay(1);
        LocalDate monthEnd = thisMonth.atEndOfMonth();

        List<ShowResponse> popular = showRepository.findPopularOngoing(pageable).stream().map(ShowResponse::from).toList();
        if (popular.isEmpty()) {
            popular = showRepository.findByStatusWithTheaterList(Show.Status.ONGOING, pageable).stream().map(ShowResponse::from).toList();
        }
        if (popular.isEmpty()) {
            popular = showRepository.findAllWithTheaterList(pageable).stream().map(ShowResponse::from).toList();
        }

        List<ShowResponse> endingSoon = showRepository.findEndingSoon(pageable).stream().map(ShowResponse::from).toList();

        List<ShowResponse> openingThisMonth = showRepository.findOpeningBetween(LocalDate.now(), monthEnd, pageable).stream()
                .map(ShowResponse::from)
                .toList();

        List<ShowResponse> mostRecorded = getMostRecordedShows(pageable);

        return ShowHomeSectionsResponse.builder()
                .popular(popular)
                .endingSoon(endingSoon)
                .openingThisMonth(openingThisMonth)
                .mostRecorded(mostRecorded)
                .build();
    }

    public List<ShowAutocompleteResponse> autocomplete(String keyword) {
        if (keyword == null || keyword.isBlank()) return List.of();
        return showRepository.findByTitleContaining(keyword.trim(), PageRequest.of(0, 8))
                .stream().map(ShowAutocompleteResponse::from).toList();
    }

    private <T extends Enum<T>> T parseEnum(Class<T> enumClass, String value) {
        if (value == null || value.isBlank())
            return null;
        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private int safePage(int page) {
        return Math.max(page, 0);
    }

    private int safeSize(int size, int maxSize) {
        return Math.max(1, Math.min(size, maxSize));
    }

    private List<ShowResponse> getMostRecordedShows(Pageable pageable) {
        List<DiaryEntryRepository.ShowRecordCount> recordCounts = diaryEntryRepository.findMostRecordedShowIds(pageable);
        if (recordCounts.isEmpty()) {
            return List.of();
        }

        List<Long> showIds = recordCounts.stream()
                .map(DiaryEntryRepository.ShowRecordCount::getShowId)
                .toList();
        Map<Long, Show> showsById = showRepository.findAllByIdInWithTheater(showIds)
                .stream()
                .collect(Collectors.toMap(Show::getId, Function.identity()));
        Map<Long, Long> countsByShowId = recordCounts.stream()
                .collect(Collectors.toMap(
                        DiaryEntryRepository.ShowRecordCount::getShowId,
                        DiaryEntryRepository.ShowRecordCount::getRecordCount,
                        (left, right) -> left,
                        LinkedHashMap::new));

        return showIds.stream()
                .map(showsById::get)
                .filter(show -> show != null)
                .map(show -> ShowResponse.fromWithDiaryCount(show, countsByShowId.getOrDefault(show.getId(), 0L)))
                .toList();
    }

    @Transactional
    public ShowScheduleResponse getTodaySchedule(LocalDate targetDate, String genreStr) {
        LocalDate date = (targetDate != null) ? targetDate : LocalDate.now(ZoneId.of("Asia/Seoul"));
        Show.Genre genre = parseEnum(Show.Genre.class, genreStr);

        List<Show> shows = (genre != null)
                ? showRepository.findOngoingShowsOnDateAndGenre(date, genre)
                : showRepository.findOngoingShowsOnDate(date);

        Map<String, List<ShowScheduleResponse.ScheduleShowItem>> timeSlotMap = new TreeMap<>();
        Set<Long> countedShowIds = new HashSet<>();

        for (Show show : shows) {
            List<String> times = extractTimesForDate(show.getDtguidance(), date);
            if (!times.isEmpty()) {
                countedShowIds.add(show.getId());
            }
            String normalizedRegion = show.getTheater() != null
                    ? RegionNormalizer.normalize(show.getTheater().getRegion(), show.getTheater().getAddress())
                    : null;
            for (String time : times) {
                ShowScheduleResponse.ScheduleShowItem item = ShowScheduleResponse.ScheduleShowItem.builder()
                        .id(show.getId())
                        .kopisId(show.getKopisId())
                        .title(show.getTitle())
                        .genre(show.getGenre() != null ? show.getGenre().name() : null)
                        .genreDisplayName(show.getGenre() != null ? show.getGenre().getDisplayName() : null)
                        .theaterName(show.getTheater() != null ? show.getTheater().getName() : null)
                        .theaterRegion(normalizedRegion)
                        .sourceUpdatedAt(show.getUpdatedAt())
                        .posterUrl(show.getPosterUrl())
                        .runtime(show.getRuntime() != null && !show.getRuntime().isBlank() ? show.getRuntime().trim() : null)
                        .priceInfo(show.getPriceInfo() != null && !show.getPriceInfo().isBlank() ? show.getPriceInfo().trim() : null)
                        .castInfo(show.getCastInfo() != null && !show.getCastInfo().isBlank() ? show.getCastInfo().trim() : null)
                        .time(time)
                        .build();

                timeSlotMap.computeIfAbsent(time, k -> new ArrayList<>()).add(item);
            }
        }

        List<ShowScheduleResponse.TimeSlot> timeSlots = new ArrayList<>();
        for (Map.Entry<String, List<ShowScheduleResponse.ScheduleShowItem>> entry : timeSlotMap.entrySet()) {
            String time = entry.getKey();
            int hour = Integer.parseInt(time.split(":")[0]);
            String label;
            if (hour >= 11 && hour < 17) {
                label = time + " (낮공)";
            } else if (hour >= 17 && hour <= 22) {
                label = time + " (밤공)";
            } else {
                label = time;
            }

            List<ShowScheduleResponse.ScheduleShowItem> sortedShows = entry.getValue();
            sortedShows.sort(Comparator
                    .comparing((ShowScheduleResponse.ScheduleShowItem s) -> s.getPosterUrl() != null && !s.getPosterUrl().isBlank() ? 0 : 1)
                    .thenComparing((ShowScheduleResponse.ScheduleShowItem s) -> "MUSICAL".equals(s.getGenre()) ? 0 : ("PLAY".equals(s.getGenre()) ? 1 : 2))
                    .thenComparing(ShowScheduleResponse.ScheduleShowItem::getTitle));

            timeSlots.add(ShowScheduleResponse.TimeSlot.builder()
                    .time(time)
                    .label(label)
                    .count(sortedShows.size())
                    .shows(sortedShows)
                    .build());
        }

        String[] dayNames = {"", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"};
        String dayOfWeekStr = dayNames[date.getDayOfWeek().getValue()];

        return ShowScheduleResponse.builder()
                .date(date)
                .dayOfWeek(dayOfWeekStr)
                .totalShowsToday(countedShowIds.size())
                .timeSlots(timeSlots)
                .build();
    }

    private static boolean isValidShowTime(String time) {
        if (time == null || !time.contains(":")) {
            return false;
        }
        try {
            String[] parts = time.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            return (h >= 10 && h <= 22 && m >= 0 && m <= 59);
        } catch (Exception e) {
            return false;
        }
    }

    static List<String> extractTimesForDate(String dtguidance, LocalDate date) {
        if (dtguidance == null || dtguidance.isBlank()) {
            return Collections.emptyList();
        }

        DayOfWeek dow = date.getDayOfWeek();
        boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);
        String dayName = getKoreanDay(dow);

        List<String> times = new ArrayList<>();
        boolean matchedParenthesized = false;

        Pattern parenPattern = Pattern.compile("([^()]+?)\\(([^)]+)\\)");
        Matcher parenMatcher = parenPattern.matcher(dtguidance);
        while (parenMatcher.find()) {
            matchedParenthesized = true;
            String daySpec = parenMatcher.group(1).replaceAll("^[,/\\s]+", "").trim();
            String timeGroup = parenMatcher.group(2);
            if (timeGroup != null && matchesDay(daySpec, dow, dayName, isWeekend)) {
                collectNormalizedTimes(timeGroup, times);
            }
        }

        if (!matchedParenthesized) {
            Pattern barePattern = Pattern.compile("([^,/(]+?)([0-9]{1,2}:[0-9]{2})");
            Matcher bareMatcher = barePattern.matcher(dtguidance);
            while (bareMatcher.find()) {
                String daySpec = bareMatcher.group(1).trim();
                String timeGroup = bareMatcher.group(2);
                if (timeGroup != null && matchesDay(daySpec, dow, dayName, isWeekend)) {
                    collectNormalizedTimes(timeGroup, times);
                }
            }
        }

        Collections.sort(times);
        return times;
    }

    private static void collectNormalizedTimes(String timeGroup, List<String> times) {
        Matcher timeMatcher = Pattern.compile("(\\d{1,2}:\\d{2})").matcher(timeGroup);
        while (timeMatcher.find()) {
            String time = normalizeTime(timeMatcher.group(1));
            if (isValidShowTime(time) && !times.contains(time)) {
                times.add(time);
            }
        }
    }

    private static boolean matchesDay(String daySpec, DayOfWeek dow, String dayName, boolean isWeekend) {
        if (daySpec == null || daySpec.isBlank()) {
            return false;
        }
        for (String rawClause : daySpec.split("[,/]+")) {
            if (matchesDayClause(rawClause, dow, dayName, isWeekend)) {
                return true;
            }
        }
        return false;
    }

    private static boolean matchesDayClause(String rawClause, DayOfWeek dow, String dayName, boolean isWeekend) {
        if (rawClause == null) {
            return false;
        }
        String cleaned = rawClause
                .replace("공휴일", "")
                .replace("휴일", "")
                .replace("HOL", "")
                .replace("요일", "")
                .trim();
        if (cleaned.isEmpty()) {
            return false;
        }
        if (cleaned.contains("주말")) {
            if (isWeekend) return true;
            cleaned = cleaned.replace("주말", "").trim();
        }
        if (cleaned.contains("평일")) {
            if (!isWeekend) return true;
            cleaned = cleaned.replace("평일", "").trim();
        }
        if (cleaned.isEmpty()) {
            return false;
        }
        if (cleaned.contains("~") || cleaned.contains("-")) {
            String[] parts = cleaned.split("[~-]");
            if (parts.length == 2) {
                int start = parseDayValue(parts[0]);
                int end = parseDayValue(parts[1]);
                int current = dow.getValue();
                if (start > 0 && end > 0) {
                    if (start <= end && current >= start && current <= end) return true;
                    if (start > end && (current >= start || current <= end)) return true;
                }
            }
            return false;
        }
        return cleaned.contains(dayName);
    }

    private static int parseDayValue(String str) {
        if (str.contains("월")) return 1;
        if (str.contains("화")) return 2;
        if (str.contains("수")) return 3;
        if (str.contains("목")) return 4;
        if (str.contains("금")) return 5;
        if (str.contains("토")) return 6;
        if (str.contains("일")) return 7;
        return 0;
    }

    private static String getKoreanDay(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "월";
            case TUESDAY -> "화";
            case WEDNESDAY -> "수";
            case THURSDAY -> "목";
            case FRIDAY -> "금";
            case SATURDAY -> "토";
            case SUNDAY -> "일";
        };
    }

    private static String normalizeTime(String raw) {
        String[] parts = raw.split(":");
        int h = Integer.parseInt(parts[0]);
        return String.format("%02d:%s", h, parts[1]);
    }
}
