package com.curtaincall.domain.favorite.repository;

import com.curtaincall.domain.favorite.entity.FavoriteShow;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface FavoriteShowRepository extends JpaRepository<FavoriteShow, Long> {

    boolean existsByUserIdAndShowId(Long userId, Long showId);

    boolean existsByUserAndShow(User user, Show show);

    Optional<FavoriteShow> findByUserAndShow(User user, Show show);

    @Query(value = "SELECT f.show FROM FavoriteShow f JOIN FETCH f.show.theater WHERE f.user = :user ORDER BY f.createdAt DESC",
           countQuery = "SELECT COUNT(f) FROM FavoriteShow f WHERE f.user = :user")
    Page<Show> findShowsByUser(User user, Pageable pageable);

    long countByShowId(Long showId);

    long countByShow(Show show);

    void deleteByUserAndShow(User user, Show show);
}
