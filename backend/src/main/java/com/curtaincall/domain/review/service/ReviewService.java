package com.curtaincall.domain.review.service;

import com.curtaincall.domain.review.dto.*;
import com.curtaincall.domain.review.entity.Review;
import com.curtaincall.domain.review.entity.ReviewComment;
import com.curtaincall.domain.review.entity.ReviewLike;
import com.curtaincall.domain.review.repository.ReviewCommentRepository;
import com.curtaincall.domain.review.repository.ReviewCommentRepository.CommentCountProjection;
import com.curtaincall.domain.review.repository.ReviewLikeRepository;
import com.curtaincall.domain.review.repository.ReviewRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

        private final ReviewRepository reviewRepository;
        private final ReviewCommentRepository commentRepository;
        private final ReviewLikeRepository likeRepository;
        private final ShowRepository showRepository;
        private final UserRepository userRepository;
        private final CacheManager cacheManager;

        private void evictShowDetailCache(Long showId) {
                var cache = cacheManager.getCache("showDetail");
                if (cache != null) {
                        cache.evict(showId);
                }
        }

        public Page<ReviewResponse> getReviewsByShow(Long showId, String sort, int page, int size, Long currentUserId) {
                PageRequest pageable = PageRequest.of(page, size);
                Page<Review> reviews = "likes".equals(sort)
                                ? reviewRepository.findByShowIdOrderByLikeCountDesc(showId, pageable)
                                : reviewRepository.findByShowIdOrderByCreatedAtDesc(showId, pageable);

                return enrichReviews(reviews, currentUserId);
        }

        @Transactional
        public ReviewResponse createReview(Long userId, Long showId, ReviewRequest request) {
                if (reviewRepository.existsByShowIdAndUserId(showId, userId)) {
                        throw BusinessException.badRequest("이미 해당 공연에 리뷰를 작성했습니다.");
                }
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
                Show show = showRepository.findById(showId)
                                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));

                Review review = reviewRepository.save(Review.builder()
                                .user(user)
                                .show(show)
                                .storyScore(request.getStoryScore())
                                .castScore(request.getCastScore())
                                .directionScore(request.getDirectionScore())
                                .soundScore(request.getSoundScore())
                                .content(request.getContent())
                                .hasSpoiler(request.getHasSpoiler() != null ? request.getHasSpoiler() : false)
                                .build());

                evictShowDetailCache(showId);
                return ReviewResponse.from(review, false, 0L);
        }

        @Transactional
        public ReviewResponse updateReview(Long userId, Long reviewId, ReviewRequest request) {
                Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                                .orElseThrow(() -> BusinessException.notFound("리뷰를 찾을 수 없습니다."));

                review.update(request.getStoryScore(), request.getCastScore(),
                                request.getDirectionScore(), request.getSoundScore(),
                                request.getContent(),
                                request.getHasSpoiler() != null ? request.getHasSpoiler() : false);

                evictShowDetailCache(review.getShow().getId());
                long commentCount = commentRepository.countByReviewId(reviewId);
                boolean isLiked = likeRepository.existsByReviewIdAndUserId(reviewId, userId);
                return ReviewResponse.from(review, isLiked, commentCount);
        }

        @Transactional
        public void deleteReview(Long userId, Long reviewId) {
                Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                                .orElseThrow(() -> BusinessException.notFound("리뷰를 찾을 수 없습니다."));
                Long showId = review.getShow().getId();
                reviewRepository.delete(review);
                evictShowDetailCache(showId);
        }

        @Transactional
        public boolean toggleLike(Long userId, Long reviewId) {
                Review review = reviewRepository.findById(reviewId)
                                .orElseThrow(() -> BusinessException.notFound("리뷰를 찾을 수 없습니다."));
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

                return likeRepository.findByReviewIdAndUserId(reviewId, userId)
                                .map(like -> {
                                        likeRepository.delete(like);
                                        review.decreaseLikeCount();
                                        return false;
                                })
                                .orElseGet(() -> {
                                        likeRepository.save(ReviewLike.builder().review(review).user(user).build());
                                        review.increaseLikeCount();
                                        return true;
                                });
        }

        public Page<CommentResponse> getComments(Long reviewId, int page, int size) {
                return commentRepository
                                .findByReviewIdAndParentIsNullOrderByCreatedAtAsc(reviewId, PageRequest.of(page, size))
                                .map(CommentResponse::from);
        }

        @Transactional
        public CommentResponse createComment(Long userId, Long reviewId, CommentRequest request) {
                Review review = reviewRepository.findById(reviewId)
                                .orElseThrow(() -> BusinessException.notFound("리뷰를 찾을 수 없습니다."));
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

                ReviewComment parent = null;
                if (request.getParentId() != null) {
                        parent = commentRepository.findById(request.getParentId())
                                        .orElseThrow(() -> BusinessException.notFound("원 댓글을 찾을 수 없습니다."));
                }

                ReviewComment comment = commentRepository.save(ReviewComment.builder()
                                .review(review).user(user).parent(parent).content(request.getContent()).build());

                return CommentResponse.from(comment);
        }

        @Transactional
        public void deleteComment(Long userId, Long commentId) {
                ReviewComment comment = commentRepository.findByIdAndUserId(commentId, userId)
                                .orElseThrow(() -> BusinessException.notFound("댓글을 찾을 수 없습니다."));
                commentRepository.delete(comment);
        }

        public Page<ReviewResponse> getMyReviews(Long userId, int page, int size) {
                Page<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
                return enrichReviews(reviews, userId);
        }

        private Page<ReviewResponse> enrichReviews(Page<Review> reviews, Long currentUserId) {
                List<Long> reviewIds = reviews.getContent().stream().map(Review::getId).toList();
                if (reviewIds.isEmpty()) return reviews.map(r -> ReviewResponse.from(r, false, 0L));

                Set<Long> likedIds = currentUserId != null
                                ? likeRepository.findLikedReviewIds(reviewIds, currentUserId)
                                : Collections.emptySet();

                Map<Long, Long> commentCounts = commentRepository.countByReviewIds(reviewIds).stream()
                                .collect(Collectors.toMap(CommentCountProjection::getReviewId, CommentCountProjection::getCount));

                return reviews.map(review -> ReviewResponse.from(
                                review,
                                likedIds.contains(review.getId()),
                                commentCounts.getOrDefault(review.getId(), 0L)));
        }
}
