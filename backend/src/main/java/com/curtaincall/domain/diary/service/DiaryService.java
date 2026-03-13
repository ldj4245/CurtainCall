package com.curtaincall.domain.diary.service;

import com.curtaincall.domain.diary.dto.DiaryRequest;
import com.curtaincall.domain.diary.dto.DiaryResponse;
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

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private final DiaryEntryRepository diaryEntryRepository;
    private final ShowRepository showRepository;
    private final UserRepository userRepository;
    private final ImageUploadService imageUploadService;

    public Page<DiaryResponse> getMyDiary(Long userId, int page, int size) {
        return diaryEntryRepository
                .findByUserIdOrderByWatchedDateDesc(userId, PageRequest.of(page, size))
                .map(DiaryResponse::from);
    }

    public DiaryStatsDto getMyStats(Long userId) {
        return diaryEntryRepository.getStatsByUserId(userId);
    }

    @Transactional
    public DiaryResponse createDiary(Long userId, DiaryRequest request) {
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
                .photoUrls(joinPhotoUrls(request.getPhotoUrls()))
                .build());

        return DiaryResponse.from(entry);
    }

    @Transactional
    public DiaryResponse updateDiary(Long userId, Long diaryId, DiaryRequest request) {
        DiaryEntry entry = diaryEntryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> BusinessException.notFound("관극 기록을 찾을 수 없습니다."));

        List<String> existingPhotoUrls = parsePhotoUrls(entry.getPhotoUrls());
        List<String> updatedPhotoUrls = normalizePhotoUrls(request.getPhotoUrls());

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

        deleteImagesAfterCommit(getRemovedPhotoUrls(existingPhotoUrls, updatedPhotoUrls));
        return DiaryResponse.from(entry);
    }

    @Transactional
    public void deleteDiary(Long userId, Long diaryId) {
        DiaryEntry entry = diaryEntryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> BusinessException.notFound("관극 기록을 찾을 수 없습니다."));

        List<String> imageUrls = parsePhotoUrls(entry.getPhotoUrls());
        diaryEntryRepository.delete(entry);
        deleteImagesAfterCommit(imageUrls);
    }

    public List<DiaryResponse> getPublicDiaryByShow(Long showId) {
        return diaryEntryRepository.findPublicByShowId(showId).stream()
                .map(DiaryResponse::from)
                .toList();
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
        return String.join(",", normalized);
    }

    private List<String> normalizePhotoUrls(List<String> photoUrls) {
        if (photoUrls == null || photoUrls.isEmpty()) {
            return List.of();
        }
        return photoUrls.stream()
                .filter(url -> url != null && !url.isBlank())
                .map(String::trim)
                .toList();
    }

    private List<String> parsePhotoUrls(String photoUrls) {
        if (photoUrls == null || photoUrls.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(photoUrls.split(","))
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .toList();
    }

    private List<String> getRemovedPhotoUrls(List<String> previous, List<String> current) {
        return previous.stream()
                .filter(url -> !current.contains(url))
                .toList();
    }

    private void deleteImagesAfterCommit(List<String> imageUrls) {
        if (imageUrls.isEmpty()) {
            return;
        }

        Runnable deleteTask = () -> imageUrls.forEach(imageUploadService::deleteImage);
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
}
