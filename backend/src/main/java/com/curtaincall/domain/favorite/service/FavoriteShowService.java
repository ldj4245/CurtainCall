package com.curtaincall.domain.favorite.service;

import com.curtaincall.domain.favorite.entity.FavoriteShow;
import com.curtaincall.domain.favorite.repository.FavoriteShowRepository;
import com.curtaincall.domain.show.dto.ShowResponse;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteShowService {

    private final FavoriteShowRepository favoriteShowRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> toggleFavorite(Long userId, Long showId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다"));
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다"));

        boolean isFavorited;
        if (favoriteShowRepository.existsByUserAndShow(user, show)) {
            favoriteShowRepository.deleteByUserAndShow(user, show);
            isFavorited = false;
        } else {
            favoriteShowRepository.save(FavoriteShow.builder()
                    .user(user)
                    .show(show)
                    .build());
            isFavorited = true;
        }

        long count = favoriteShowRepository.countByShow(show);
        return Map.of("isFavorited", isFavorited, "favoriteCount", count);
    }

    public boolean isFavorited(Long userId, Long showId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return false;
        Show show = showRepository.findById(showId).orElse(null);
        if (show == null)
            return false;
        return favoriteShowRepository.existsByUserAndShow(user, show);
    }

    public long getFavoriteCount(Long showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다"));
        return favoriteShowRepository.countByShow(show);
    }

    public Page<ShowResponse> getMyFavorites(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다"));
        return favoriteShowRepository.findShowsByUser(user, PageRequest.of(page, size))
                .map(ShowResponse::from);
    }
}
