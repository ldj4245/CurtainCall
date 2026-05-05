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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_HOME_LIMIT = 20;

    private final ShowRepository showRepository;
    private final ReviewRepository reviewRepository;
    private final DiaryEntryRepository diaryEntryRepository;

    @Cacheable(value = "showsSearch", key = "{#keyword, #genre, #status, #region, #page, #size}")
    public Page<ShowResponse> searchShows(String keyword, String genre, String status, String region, int page,
            int size) {
        Pageable pageable = PageRequest.of(safePage(page), safeSize(size, MAX_PAGE_SIZE));
        Show.Genre genreEnum = parseEnum(Show.Genre.class, genre);
        Show.Status statusEnum = parseEnum(Show.Status.class, status);

        return showRepository.searchShows(keyword, genreEnum, statusEnum, region, pageable)
                .map(ShowResponse::from);
    }

    @Cacheable(value = "showDetail", key = "#id")
    public ShowResponse getShow(Long id) {
        Show show = showRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));

        Double averageScore = reviewRepository.getAverageScoreByShowId(id);
        long reviewCount = reviewRepository.countByShowId(id);

        return ShowResponse.fromWithStats(show,
                averageScore != null ? Math.round(averageScore * 10.0) / 10.0 : null,
                reviewCount);
    }

    @Cacheable(value = "ongoingShows", key = "#limit")
    public List<ShowResponse> getOngoingShows(int limit) {
        Pageable pageable = PageRequest.of(0, safeSize(limit, MAX_HOME_LIMIT));
        return showRepository.findTop10ByStatusOngoing(pageable)
                .stream().map(ShowResponse::from).toList();
    }

    @Cacheable(value = "popularShows", key = "#limit")
    public List<ShowResponse> getPopularShows(int limit) {
        Pageable pageable = PageRequest.of(0, safeSize(limit, MAX_HOME_LIMIT));
        return showRepository.findPopularOngoing(pageable)
                .stream().map(ShowResponse::from).toList();
    }

    @Cacheable(value = "homeShowSections", key = "#limit")
    public ShowHomeSectionsResponse getHomeSections(int limit) {
        int size = safeSize(limit, MAX_HOME_LIMIT);
        Pageable pageable = PageRequest.of(0, size);
        YearMonth thisMonth = YearMonth.now();
        LocalDate monthStart = thisMonth.atDay(1);
        LocalDate monthEnd = thisMonth.atEndOfMonth();

        return ShowHomeSectionsResponse.builder()
                .popular(showRepository.findPopularOngoing(pageable).stream().map(ShowResponse::from).toList())
                .endingSoon(showRepository.findEndingSoon(pageable).stream().map(ShowResponse::from).toList())
                .openingThisMonth(showRepository.findOpeningBetween(monthStart, monthEnd, pageable).stream()
                        .map(ShowResponse::from)
                        .toList())
                .mostRecorded(getMostRecordedShows(pageable))
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
}
