package com.curtaincall.domain.show.repository;

import com.curtaincall.domain.show.entity.Show;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ShowRepositoryCustom {
    Page<Show> searchShows(String keyword, Show.Genre genre, Show.Status status, String region, Pageable pageable);
}
