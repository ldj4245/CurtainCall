package com.curtaincall.domain.community.repository;

import com.curtaincall.domain.community.entity.CommunityPostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, Long> {

    Optional<CommunityPostLike> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    @Query("SELECT l.post.id FROM CommunityPostLike l WHERE l.post.id IN :postIds AND l.user.id = :userId")
    Set<Long> findLikedPostIds(@Param("postIds") List<Long> postIds, @Param("userId") Long userId);
}
