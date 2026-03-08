package com.curtaincall.domain.companion.service;

import com.curtaincall.domain.chat.entity.ChatRoom;
import com.curtaincall.domain.chat.repository.ChatMessageRepository;
import com.curtaincall.domain.chat.repository.ChatRoomRepository;
import com.curtaincall.domain.chat.service.ChatService;
import com.curtaincall.domain.companion.dto.CompanionParticipantResponse;
import com.curtaincall.domain.companion.dto.CompanionPostRequest;
import com.curtaincall.domain.companion.dto.CompanionPostResponse;
import com.curtaincall.domain.companion.entity.CompanionParticipant;
import com.curtaincall.domain.companion.entity.CompanionPost;
import com.curtaincall.domain.companion.repository.CompanionParticipantRepository;
import com.curtaincall.domain.companion.repository.CompanionPostRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanionService {

    private final CompanionPostRepository companionPostRepository;
    private final CompanionParticipantRepository companionParticipantRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    public Page<CompanionPostResponse> getCompanions(Long showId, boolean onlyOpen, Pageable pageable) {
        Page<CompanionPost> posts = onlyOpen
                ? companionPostRepository.findByShowIdAndStatus(showId, CompanionPost.Status.OPEN, pageable)
                : companionPostRepository.findByShowId(showId, pageable);
        return toResponsePage(posts);
    }

    public Page<CompanionPostResponse> getRecentCompanions(Pageable pageable) {
        return toResponsePage(companionPostRepository.findByStatus(CompanionPost.Status.OPEN, pageable));
    }

    private Page<CompanionPostResponse> toResponsePage(Page<CompanionPost> posts) {
        List<Long> postIds = posts.getContent().stream().map(CompanionPost::getId).toList();
        if (postIds.isEmpty()) return posts.map(post -> CompanionPostResponse.from(post, List.of(), null));

        Map<Long, List<CompanionParticipantResponse>> participantsByPost = companionParticipantRepository
                .findByCompanionPostIdIn(postIds).stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCompanionPost().getId(),
                        Collectors.mapping(CompanionParticipantResponse::from, Collectors.toList())));

        Map<Long, Long> chatRoomByPost = chatRoomRepository.findByCompanionPostIdIn(postIds).stream()
                .collect(Collectors.toMap(r -> r.getCompanionPost().getId(), ChatRoom::getId));

        List<CompanionPostResponse> content = posts.getContent().stream()
                .map(post -> CompanionPostResponse.from(
                        post,
                        participantsByPost.getOrDefault(post.getId(), List.of()),
                        chatRoomByPost.get(post.getId())))
                .toList();

        return new PageImpl<>(content, posts.getPageable(), posts.getTotalElements());
    }

    @Transactional
    public Long createCompanionPost(Long showId, Long userId, CompanionPostRequest request) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> BusinessException.notFound("해당 공연을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        CompanionPost post = CompanionPost.builder()
                .show(show)
                .author(user)
                .title(request.getTitle())
                .content(request.getContent())
                .performanceDate(request.getPerformanceDate())
                .performanceTime(request.getPerformanceTime())
                .maxMembers(request.getMaxMembers())
                .seatInfo(request.getSeatInfo())
                .build();

        CompanionPost savedPost = companionPostRepository.save(post);

        // 작성자 본인은 자동으로 참여자로 등록
        CompanionParticipant participant = CompanionParticipant.builder()
                .companionPost(savedPost)
                .user(user)
                .build();
        companionParticipantRepository.save(participant);

        return savedPost.getId();
    }

    @Transactional
    public void joinCompanion(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> BusinessException.notFound("해당 모집글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        if (post.getStatus() != CompanionPost.Status.OPEN) {
            throw BusinessException.badRequest("이미 마감되었거나 만료된 모집글입니다.");
        }

        if (companionParticipantRepository.existsByCompanionPostIdAndUserId(postId, userId)) {
            throw BusinessException.conflict("이미 참여한 모집글입니다.");
        }

        CompanionParticipant participant = CompanionParticipant.builder()
                .companionPost(post)
                .user(user)
                .build();
        companionParticipantRepository.save(participant);

        post.incrementMembers();

        chatService.createRoomForCompanionPost(post);
    }

    @Transactional
    public void cancelJoin(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> BusinessException.notFound("해당 모집글을 찾을 수 없습니다."));

        if (post.getAuthor().getId().equals(userId)) {
            throw BusinessException.badRequest("작성자는 참여를 취소할 수 없습니다. 글을 삭제해주세요.");
        }

        CompanionParticipant participant = companionParticipantRepository.findByCompanionPostIdAndUserId(postId, userId)
                .orElseThrow(() -> BusinessException.notFound("참여 내역이 없습니다."));

        companionParticipantRepository.delete(participant);
        post.decrementMembers();
    }

    @Transactional
    public void closeCompanion(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> BusinessException.notFound("해당 모집글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("작성자만 마감할 수 있습니다.");
        }

        if (post.getStatus() != CompanionPost.Status.OPEN) {
            throw BusinessException.badRequest("이미 마감된 모집글입니다.");
        }

        post.markAsClosed();
    }

    @Transactional
    public void deleteCompanion(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> BusinessException.notFound("해당 모집글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw BusinessException.forbidden("작성자만 삭제할 수 있습니다.");
        }

        chatRoomRepository.findByCompanionPostId(postId).ifPresent(room -> {
            chatMessageRepository.deleteByRoomId(room.getId());
            chatRoomRepository.delete(room);
        });
        companionParticipantRepository.deleteByCompanionPostId(postId);
        companionPostRepository.delete(post);
    }
}
