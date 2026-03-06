package com.curtaincall.domain.companion.service;

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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanionService {

    private final CompanionPostRepository companionPostRepository;
    private final CompanionParticipantRepository companionParticipantRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;

    public Page<CompanionPostResponse> getCompanions(Long showId, boolean onlyOpen, Pageable pageable) {
        Page<CompanionPost> posts;
        if (onlyOpen) {
            posts = companionPostRepository.findByShowIdAndStatus(showId, CompanionPost.Status.OPEN, pageable);
        } else {
            posts = companionPostRepository.findByShowId(showId, pageable);
        }

        return posts.map(post -> {
            List<CompanionParticipantResponse> participants = companionParticipantRepository
                    .findByCompanionPostId(post.getId())
                    .stream()
                    .map(CompanionParticipantResponse::from)
                    .collect(Collectors.toList());
            return CompanionPostResponse.from(post, participants);
        });
    }

    @Transactional
    public Long createCompanionPost(Long showId, Long userId, CompanionPostRequest request) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공연을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

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
                .orElseThrow(() -> new IllegalArgumentException("해당 모집글을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (post.getStatus() != CompanionPost.Status.OPEN) {
            throw new IllegalStateException("이미 마감되었거나 만료된 모집글입니다.");
        }

        if (companionParticipantRepository.existsByCompanionPostIdAndUserId(postId, userId)) {
            throw new IllegalStateException("이미 참여한 모집글입니다.");
        }

        CompanionParticipant participant = CompanionParticipant.builder()
                .companionPost(post)
                .user(user)
                .build();
        companionParticipantRepository.save(participant);

        post.incrementMembers();
    }

    @Transactional
    public void cancelJoin(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 모집글을 찾을 수 없습니다."));

        if (post.getAuthor().getId().equals(userId)) {
            throw new IllegalStateException("작성자는 참여를 취소할 수 없습니다. 글을 삭제해주세요.");
        }

        CompanionParticipant participant = companionParticipantRepository.findByCompanionPostIdAndUserId(postId, userId)
                .orElseThrow(() -> new IllegalArgumentException("참여 내역이 없습니다."));

        companionParticipantRepository.delete(participant);
        post.decrementMembers();
    }

    @Transactional
    public void closeCompanion(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 모집글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("작성자만 마감할 수 있습니다.");
        }

        if (post.getStatus() != CompanionPost.Status.OPEN) {
            throw new IllegalStateException("이미 마감된 모집글입니다.");
        }

        post.markAsClosed();
    }

    @Transactional
    public void deleteCompanion(Long postId, Long userId) {
        CompanionPost post = companionPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 모집글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("작성자만 삭제할 수 있습니다.");
        }

        companionParticipantRepository.deleteAll(companionParticipantRepository.findByCompanionPostId(postId));
        companionPostRepository.delete(post);
    }
}
