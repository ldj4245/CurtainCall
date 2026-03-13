package com.curtaincall.domain.review.service;

import com.curtaincall.domain.review.dto.CommentRequest;
import com.curtaincall.domain.review.entity.Review;
import com.curtaincall.domain.review.entity.ReviewComment;
import com.curtaincall.domain.review.repository.ReviewCommentRepository;
import com.curtaincall.domain.review.repository.ReviewLikeRepository;
import com.curtaincall.domain.review.repository.ReviewRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ReviewCommentRepository commentRepository;
    @Mock
    private ReviewLikeRepository likeRepository;
    @Mock
    private ShowRepository showRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CacheManager cacheManager;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(
                reviewRepository,
                commentRepository,
                likeRepository,
                showRepository,
                userRepository,
                cacheManager
        );
    }

    @Test
    void createCommentRejectsParentFromDifferentReview() {
        Long reviewId = 1L;
        Long userId = 2L;
        Long parentId = 3L;

        Review review = review(reviewId);
        User user = user(userId);
        ReviewComment parent = ReviewComment.builder()
                .review(review(99L))
                .user(user)
                .content("부모 댓글")
                .build();

        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findById(parentId)).thenReturn(Optional.of(parent));

        CommentRequest request = request("답글", parentId);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reviewService.createComment(userId, reviewId, request)
        );

        assertEquals("같은 리뷰의 댓글에만 답글을 달 수 있습니다.", exception.getMessage());
        verify(commentRepository, never()).save(any());
    }

    @Test
    void createCommentRejectsReplyToReply() {
        Long reviewId = 1L;
        Long userId = 2L;
        Long parentId = 3L;

        Review review = review(reviewId);
        User user = user(userId);
        ReviewComment grandParent = ReviewComment.builder()
                .review(review)
                .user(user)
                .content("상위 댓글")
                .build();
        ReviewComment parent = ReviewComment.builder()
                .review(review)
                .user(user)
                .parent(grandParent)
                .content("대댓글")
                .build();

        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findById(parentId)).thenReturn(Optional.of(parent));

        CommentRequest request = request("다시 답글", parentId);

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> reviewService.createComment(userId, reviewId, request)
        );

        assertEquals("대댓글에는 다시 답글을 달 수 없습니다.", exception.getMessage());
        verify(commentRepository, never()).save(any());
    }

    private CommentRequest request(String content, Long parentId) {
        CommentRequest request = new CommentRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "parentId", parentId);
        return request;
    }

    private Review review(Long reviewId) {
        Review review = Review.builder()
                .id(reviewId)
                .user(user(1L))
                .show(Show.builder().id(10L).kopisId("show-" + reviewId).title("공연").build())
                .storyScore(5)
                .castScore(5)
                .directionScore(5)
                .soundScore(5)
                .content("리뷰")
                .build();
        return review;
    }

    private User user(Long userId) {
        return User.builder()
                .id(userId)
                .nickname("테스터")
                .email("tester@example.com")
                .role(User.Role.USER)
                .build();
    }
}
