package com.curtaincall.domain.diary.service;

import com.curtaincall.domain.diary.dto.DiaryRequest;
import com.curtaincall.domain.diary.dto.DiaryResponse;
import com.curtaincall.domain.diary.dto.DiarySnippetItemDto;
import com.curtaincall.domain.diary.dto.DiarySnippetResponse;
import com.curtaincall.domain.diary.dto.DiaryStatsDto;
import com.curtaincall.domain.diary.entity.DiaryEntry;
import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import com.curtaincall.global.infra.storage.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.curtaincall.domain.diary.dto.PhotoUrls;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private static final int MAX_PAGE_SIZE = 50;

    private final DiaryEntryRepository diaryEntryRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final ImageUploadService imageUploadService;
    private final com.curtaincall.domain.plan.ViewingPlanService planService;

    public Page<DiaryResponse> getMyDiary(Long userId, int page, int size) {
        return diaryEntryRepository
                .findByUserIdOrderByWatchedDateDesc(userId, safePageRequest(page, size))
                .map(DiaryResponse::from);
    }

    public DiaryStatsDto getMyStats(Long userId) {
        return diaryEntryRepository.getStatsByUserId(userId);
    }

    @Transactional
    public DiaryResponse createDiary(Long userId, DiaryRequest request) {
        var plan = request.getPlanId() == null ? null : planService.owned(request.getPlanId(), userId);
        if (plan != null && plan.getDiaryId() != null) {
            return diaryEntryRepository.findByIdAndUserId(plan.getDiaryId(), userId).map(DiaryResponse::from)
                    .orElseThrow(() -> BusinessException.badRequest("이미 기록으로 옮긴 일정입니다."));
        }
        if (plan != null && !plan.getShow().getId().equals(request.getShowId()))
            throw BusinessException.badRequest("일정과 기록의 공연이 다릅니다.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));

        DiaryEntry entry = diaryEntryRepository.save(DiaryEntry.builder()
                .user(user)
                .show(show)
                .watchedDate(request.getWatchedDate())
                .seatInfo(request.getSeatInfo())
                .castMemo(request.getCastMemo())
                .rating(request.getRating())
                .comment(request.getComment())
                .ticketPrice(request.getTicketPrice())
                .isOpen(Boolean.TRUE.equals(request.getIsOpen()))
                .hasSpoiler(Boolean.TRUE.equals(request.getHasSpoiler()))
                .photoUrls(joinPhotoUrls(request.getPhotoUrls()))
                .build());

        if (plan != null) plan.complete(entry.getId());
        return DiaryResponse.from(entry);
    }

    @Transactional
    public DiaryResponse updateDiary(Long userId, Long diaryId, DiaryRequest request) {
        DiaryEntry entry = diaryEntryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> BusinessException.notFound("관극 기록을 찾을 수 없습니다."));

        List<String> existingPhotoUrls = parsePhotoUrls(entry.getPhotoUrls());
        List<String> updatedPhotoUrls = normalizePhotoUrls(request.getPhotoUrls());

        if (!entry.getShow().getId().equals(request.getShowId()))
            throw BusinessException.badRequest("기록의 공연은 변경할 수 없습니다.");

        entry.update(
                request.getWatchedDate(),
                request.getSeatInfo(),
                request.getCastMemo(),
                request.getRating(),
                request.getComment(),
                request.getTicketPrice(),
                Boolean.TRUE.equals(request.getIsOpen()),
                joinPhotoUrls(updatedPhotoUrls)
        );

        entry.updatePublishing(Boolean.TRUE.equals(request.getHasSpoiler()));
        deleteImagesAfterCommit(userId, getRemovedPhotoUrls(existingPhotoUrls, updatedPhotoUrls));
        return DiaryResponse.from(entry);
    }

    @Transactional
    public void deleteDiary(Long userId, Long diaryId) {
        DiaryEntry entry = diaryEntryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> BusinessException.notFound("관극 기록을 찾을 수 없습니다."));

        List<String> imageUrls = parsePhotoUrls(entry.getPhotoUrls());
        planService.restoreDeletedRecord(userId, diaryId);
        diaryEntryRepository.delete(entry);
        deleteImagesAfterCommit(userId, imageUrls);
    }

    public List<DiaryResponse> getPublicDiaryByShow(Long showId) {
        return diaryEntryRepository.findPublicByShowId(showId).stream()
                .map(DiaryResponse::from)
                .toList();
    }

    public DiarySnippetResponse getPublicDiarySnippets(Long showId, int size) {
        int safeSize = Math.max(1, Math.min(size, 10));
        Page<DiaryEntry> page = diaryEntryRepository.findPublicPageByShowId(showId, PageRequest.of(0, safeSize));

        return DiarySnippetResponse.builder()
                .totalCount(page.getTotalElements())
                .items(page.getContent().stream()
                        .map(DiarySnippetItemDto::from)
                        .toList())
                .build();
    }

    public List<DiaryResponse> getCalendarDiary(Long userId, int year, int month) {
        java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return diaryEntryRepository.findByUserIdAndWatchedDateBetween(userId, startDate, endDate)
                .stream()
                .map(DiaryResponse::from)
                .toList();
    }

    private String joinPhotoUrls(List<String> photoUrls) {
        List<String> normalized = normalizePhotoUrls(photoUrls);
        if (normalized.isEmpty()) {
            return null;
        }
        return PhotoUrls.write(normalized);
    }

    private List<String> normalizePhotoUrls(List<String> photoUrls) {
        if (photoUrls == null || photoUrls.isEmpty()) {
            return List.of();
        }
        if (photoUrls.size() > 5 || photoUrls.stream().anyMatch(url -> url != null &&
            (url.length() > 3_000_000 || !(url.startsWith("https://") || url.startsWith("http://") || url.matches("data:image/(png|jpeg|webp|heic);base64,[A-Za-z0-9+/=\\r\\n]+")))))
            throw BusinessException.badRequest("지원하지 않는 사진 주소입니다.");
        return photoUrls.stream()
                .filter(url -> url != null && !url.isBlank())
                .map(String::trim)
                .toList();
    }

    private List<String> parsePhotoUrls(String photoUrls) {
        if (photoUrls == null || photoUrls.isBlank()) {
            return Collections.emptyList();
        }
        return PhotoUrls.read(photoUrls);
    }

    private List<String> getRemovedPhotoUrls(List<String> previous, List<String> current) {
        return previous.stream()
                .filter(url -> !current.contains(url))
                .toList();
    }

    private void deleteImagesAfterCommit(Long userId, List<String> imageUrls) {
        if (imageUrls.isEmpty()) {
            return;
        }

        Runnable deleteTask = () -> imageUrls.forEach(url -> imageUploadService.deleteOwnedDiaryImage(url, userId));
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteTask.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteTask.run();
            }
        });
    }

    private PageRequest safePageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, MAX_PAGE_SIZE)));
    }
}
