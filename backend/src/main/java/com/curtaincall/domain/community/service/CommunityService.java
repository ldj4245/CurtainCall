package com.curtaincall.domain.community.service;

import com.curtaincall.domain.community.dto.*;
import com.curtaincall.domain.community.entity.CommunityComment;
import com.curtaincall.domain.community.entity.CommunityPost;
import com.curtaincall.domain.community.entity.CommunityPostLike;
import com.curtaincall.domain.community.repository.CommunityCommentRepository;
import com.curtaincall.domain.community.repository.CommunityCommentRepository.CommentCountProjection;
import com.curtaincall.domain.community.repository.CommunityPostLikeRepository;
import com.curtaincall.domain.community.repository.CommunityPostRepository;
import com.curtaincall.domain.notification.NotificationService;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
public class CommunityService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_KEYWORD_LENGTH = 100;

    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final CommunityPostLikeRepository likeRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Page<CommunityPostSummaryResponse> getPosts(
            String category,
            Long showId,
            String keyword,
            String sort,
            int page,
            int size,
            Long currentUserId) {
        CommunityPost.Category parsedCategory = CommunityPost.Category.fromNullable(category);
        String normalizedKeyword = normalizeKeyword(keyword);
        Page<CommunityPost> posts = postRepository.searchPosts(
                parsedCategory,
                showId,
                normalizedKeyword,
                sort,
                safePageRequest(page, size)
        );
        return enrichPosts(posts, currentUserId);
    }

    public Page<CommunityPostSummaryResponse> getMyPosts(Long userId, int page, int size) {
        Page<CommunityPost> posts = postRepository.findByUserIdWithUserAndShow(userId, safePageRequest(page, size));
        return enrichPosts(posts, userId);
    }

    @Transactional
    public CommunityPostDetailResponse getPost(Long postId, boolean countView, Long currentUserId) {
        if (countView) {
            int updated = postRepository.incrementViewCount(postId);
            if (updated == 0) {
                throw BusinessException.notFound("게시글을 찾을 수 없습니다.");
            }
        }

        CommunityPost post = postRepository.findByIdWithUserAndShow(postId)
                .orElseThrow(() -> BusinessException.notFound("게시글을 찾을 수 없습니다."));
        long commentCount = commentRepository.countByPostId(postId);
        boolean liked = currentUserId != null && likeRepository.existsByPostIdAndUserId(postId, currentUserId);
        return CommunityPostDetailResponse.from(post, liked, commentCount, currentUserId);
    }

    @Transactional
    public CommunityPostDetailResponse createPost(Long userId, CommunityPostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        Show show = resolveShow(request.getShowId());
        String title = normalizeAndValidateText(request.getTitle(), 2, 120, "제목은 2자 이상 120자 이하로 입력해주세요.");
        String content = normalizeAndValidateText(request.getContent(), 2, 5000, "내용은 2자 이상 5000자 이하로 입력해주세요.");

        CommunityPost saved = postRepository.save(CommunityPost.builder()
                .user(user)
                .show(show)
                .category(request.getCategory())
                .title(title)
                .content(content)
                .build());

        return CommunityPostDetailResponse.from(saved, false, 0L, userId);
    }

    @Transactional
    public CommunityPostDetailResponse updatePost(Long userId, Long postId, CommunityPostRequest request) {
        CommunityPost post = postRepository.findByIdWithUserAndShow(postId)
                .orElseThrow(() -> BusinessException.notFound("게시글을 찾을 수 없습니다."));

        if (!post.getUser().getId().equals(userId)) {
            throw BusinessException.forbidden("작성자만 수정할 수 있습니다.");
        }

        Show show = resolveShow(request.getShowId());
        String title = normalizeAndValidateText(request.getTitle(), 2, 120, "제목은 2자 이상 120자 이하로 입력해주세요.");
        String content = normalizeAndValidateText(request.getContent(), 2, 5000, "내용은 2자 이상 5000자 이하로 입력해주세요.");

        post.update(request.getCategory(), show, title, content);

        long commentCount = commentRepository.countByPostId(postId);
        boolean liked = likeRepository.existsByPostIdAndUserId(postId, userId);
        return CommunityPostDetailResponse.from(post, liked, commentCount, userId);
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        CommunityPost post = postRepository.findByIdWithUserAndShow(postId)
                .orElseThrow(() -> BusinessException.notFound("게시글을 찾을 수 없습니다."));
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        if (!post.getUser().getId().equals(userId) && actor.getRole() != User.Role.ADMIN) {
            throw BusinessException.forbidden("삭제 권한이 없습니다.");
        }

        postRepository.delete(post);
    }

    @Transactional
    public CommunityLikeResponse toggleLike(Long userId, Long postId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> BusinessException.notFound("게시글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        return likeRepository.findByPostIdAndUserId(postId, userId)
                .map(like -> {
                    likeRepository.delete(like);
                    post.decreaseLikeCount();
                    return new CommunityLikeResponse(false, post.getLikeCount());
                })
                .orElseGet(() -> {
                    try {
                        likeRepository.save(CommunityPostLike.builder().post(post).user(user).build());
                        post.increaseLikeCount();
                    } catch (DataIntegrityViolationException ignored) {
                        // 동시 요청으로 이미 공감이 생성된 경우 공감 상태를 유지한다.
                    }
                    return new CommunityLikeResponse(true, post.getLikeCount());
                });
    }

    public Page<CommunityCommentResponse> getComments(Long postId, int page, int size) {
        if (!postRepository.existsById(postId)) {
            throw BusinessException.notFound("게시글을 찾을 수 없습니다.");
        }

        Page<CommunityComment> rootComments = commentRepository.findRootCommentsWithUser(postId, safePageRequest(page, size));
        List<Long> rootCommentIds = rootComments.getContent().stream()
                .map(CommunityComment::getId)
                .toList();

        if (rootCommentIds.isEmpty()) {
            return rootComments.map(comment -> CommunityCommentResponse.from(comment, List.of()));
        }

        Map<Long, List<CommunityCommentResponse>> repliesByParentId = commentRepository.findRepliesByParentIdIn(rootCommentIds)
                .stream()
                .collect(Collectors.groupingBy(
                        reply -> reply.getParent().getId(),
                        Collectors.mapping(CommunityCommentResponse::fromReply, Collectors.toList())
                ));

        return rootComments.map(comment -> CommunityCommentResponse.from(
                comment,
                repliesByParentId.getOrDefault(comment.getId(), List.of())
        ));
    }

    @Transactional
    public CommunityCommentResponse createComment(Long userId, Long postId, CommunityCommentRequest request) {
        CommunityPost post = postRepository.findByIdWithUserAndShow(postId)
                .orElseThrow(() -> BusinessException.notFound("게시글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        String content = normalizeAndValidateText(request.getContent(), 1, 1000, "댓글은 1자 이상 1000자 이하로 입력해주세요.");

        CommunityComment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findByIdWithUserAndPost(request.getParentId())
                    .orElseThrow(() -> BusinessException.notFound("부모 댓글을 찾을 수 없습니다."));

            if (!parent.getPost().getId().equals(postId)) {
                throw BusinessException.badRequest("같은 게시글의 댓글에만 답글을 달 수 있습니다.");
            }
            if (parent.getParent() != null) {
                throw BusinessException.badRequest("대댓글에는 다시 답글을 달 수 없습니다.");
            }
        }

        CommunityComment comment = commentRepository.save(CommunityComment.builder()
                .post(post)
                .user(user)
                .parent(parent)
                .content(content)
                .build());

        Long targetUserId = parent == null ? post.getUser().getId() : parent.getUser().getId();
        notificationService.communityComment(targetUserId, userId, comment.getId(), postId, parent != null);

        return CommunityCommentResponse.from(comment, List.of());
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        CommunityComment comment = commentRepository.findByIdWithUserAndPost(commentId)
                .orElseThrow(() -> BusinessException.notFound("댓글을 찾을 수 없습니다."));
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId) && actor.getRole() != User.Role.ADMIN) {
            throw BusinessException.forbidden("삭제 권한이 없습니다.");
        }

        commentRepository.delete(comment);
    }

    private Page<CommunityPostSummaryResponse> enrichPosts(Page<CommunityPost> posts, Long currentUserId) {
        List<Long> postIds = posts.getContent().stream().map(CommunityPost::getId).toList();
        if (postIds.isEmpty()) {
            return posts.map(post -> CommunityPostSummaryResponse.from(post, false, 0L));
        }

        Set<Long> likedIds = currentUserId != null
                ? likeRepository.findLikedPostIds(postIds, currentUserId)
                : Collections.emptySet();

        Map<Long, Long> commentCounts = commentRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(CommentCountProjection::getPostId, CommentCountProjection::getCount));

        return posts.map(post -> CommunityPostSummaryResponse.from(
                post,
                likedIds.contains(post.getId()),
                commentCounts.getOrDefault(post.getId(), 0L)
        ));
    }

    private Show resolveShow(Long showId) {
        if (showId == null) {
            return null;
        }
        return showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));
    }

    private PageRequest safePageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, MAX_PAGE_SIZE)));
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.length() > MAX_KEYWORD_LENGTH ? trimmed.substring(0, MAX_KEYWORD_LENGTH) : trimmed;
    }

    private String normalizeAndValidateText(String value, int min, int max, String message) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() < min || trimmed.length() > max) {
            throw BusinessException.badRequest(message);
        }
        return trimmed;
    }
}
