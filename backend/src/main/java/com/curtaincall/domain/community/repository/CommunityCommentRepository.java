package com.curtaincall.domain.community.repository;

import com.curtaincall.domain.community.entity.CommunityComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    @Query(value = """
            SELECT c FROM CommunityComment c
            JOIN FETCH c.user
            WHERE c.post.id = :postId AND c.parent IS NULL
            ORDER BY c.createdAt ASC, c.id ASC
            """,
            countQuery = "SELECT COUNT(c) FROM CommunityComment c WHERE c.post.id = :postId AND c.parent IS NULL")
    Page<CommunityComment> findRootCommentsWithUser(@Param("postId") Long postId, Pageable pageable);

    @Query("""
            SELECT c FROM CommunityComment c
            JOIN FETCH c.user
            JOIN FETCH c.parent
            WHERE c.parent.id IN :parentIds
            ORDER BY c.createdAt ASC, c.id ASC
            """)
    List<CommunityComment> findRepliesByParentIdIn(@Param("parentIds") List<Long> parentIds);

    @Query("""
            SELECT c FROM CommunityComment c
            JOIN FETCH c.user
            JOIN FETCH c.post
            WHERE c.id = :id
            """)
    Optional<CommunityComment> findByIdWithUserAndPost(@Param("id") Long id);

    long countByPostId(Long postId);

    @Query("SELECT c.post.id as postId, COUNT(c) as count FROM CommunityComment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<CommentCountProjection> countByPostIds(@Param("postIds") List<Long> postIds);

    interface CommentCountProjection {
        Long getPostId();
        Long getCount();
    }
}
