package com.curtaincall.domain.community.repository;

import com.curtaincall.domain.community.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long>, CommunityPostRepositoryCustom {

    @Query("""
            SELECT p FROM CommunityPost p
            JOIN FETCH p.user
            LEFT JOIN FETCH p.show
            WHERE p.id = :id
            """)
    Optional<CommunityPost> findByIdWithUserAndShow(@Param("id") Long id);

    @Query(value = """
            SELECT p FROM CommunityPost p
            JOIN FETCH p.user
            LEFT JOIN FETCH p.show
            WHERE p.user.id = :userId
            ORDER BY p.createdAt DESC, p.id DESC
            """,
            countQuery = "SELECT COUNT(p) FROM CommunityPost p WHERE p.user.id = :userId")
    Page<CommunityPost> findByUserIdWithUserAndShow(@Param("userId") Long userId, Pageable pageable);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE CommunityPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id AND p.deletedAt IS NULL")
    int incrementViewCount(@Param("id") Long id);
}
