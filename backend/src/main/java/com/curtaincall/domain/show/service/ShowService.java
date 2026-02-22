package com.curtaincall.domain.show.service;

import com.curtaincall.domain.review.repository.ReviewRepository;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShowService {

    private final ShowRepository showRepository;
    private final ReviewRepository reviewRepository;

    @Cacheable(value = "showsSearch", key = "{#keyword, #genre, #status, #region, #page, #size}")
    public Page<ShowResponse> searchShows(String keyword, String genre, String status, String region, int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size);
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
        Pageable pageable = PageRequest.of(0, limit);
        return showRepository.findTop10ByStatusOngoing(pageable)
                .stream().map(ShowResponse::from).toList();
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
}
