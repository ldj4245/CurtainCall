package com.curtaincall.domain.diary.service;

import com.curtaincall.domain.diary.dto.DiaryRequest;
import com.curtaincall.domain.diary.entity.DiaryEntry;
import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.infra.storage.ImageUploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiaryServiceTest {

    @Mock
    private DiaryEntryRepository diaryEntryRepository;
    @Mock
    private ShowRepository showRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ImageUploadService imageUploadService;

    private DiaryService diaryService;

    @BeforeEach
    void setUp() {
        diaryService = new DiaryService(
                diaryEntryRepository,
                showRepository,
                userRepository,
                imageUploadService
        );
    }

    @Test
    void updateDiaryDeletesOnlyRemovedImages() {
        DiaryEntry entry = diaryEntry(1L, "https://cdn.example.com/a.jpg,https://cdn.example.com/b.jpg");
        DiaryRequest request = diaryRequest(List.of("https://cdn.example.com/b.jpg", "https://cdn.example.com/c.jpg"));

        when(diaryEntryRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(entry));

        diaryService.updateDiary(10L, 1L, request);

        verify(imageUploadService).deleteImage("https://cdn.example.com/a.jpg");
        verify(imageUploadService, never()).deleteImage("https://cdn.example.com/b.jpg");
    }

    @Test
    void deleteDiaryDeletesAllSavedImages() {
        DiaryEntry entry = diaryEntry(1L, "https://cdn.example.com/a.jpg,https://cdn.example.com/b.jpg");

        when(diaryEntryRepository.findByIdAndUserId(1L, 10L)).thenReturn(Optional.of(entry));

        diaryService.deleteDiary(10L, 1L);

        verify(imageUploadService).deleteImage("https://cdn.example.com/a.jpg");
        verify(imageUploadService).deleteImage("https://cdn.example.com/b.jpg");
    }

    @Test
    void getPublicDiarySnippetsReturnsCountAndItems() {
        DiaryEntry first = diaryEntry(1L, "https://cdn.example.com/a.jpg");
        DiaryEntry second = diaryEntry(2L, null);
        ReflectionTestUtils.setField(second, "comment", "짧은 감상");

        when(diaryEntryRepository.findPublicPageByShowId(20L, PageRequest.of(0, 3)))
                .thenReturn(new PageImpl<>(List.of(first, second), PageRequest.of(0, 3), 7));

        var response = diaryService.getPublicDiarySnippets(20L, 3);

        assertThat(response.getTotalCount()).isEqualTo(7);
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getItems().get(0).getDiaryId()).isEqualTo(1L);
        assertThat(response.getItems().get(0).getUserNickname()).isEqualTo("테스터");
        assertThat(response.getItems().get(0).getRepresentativeImageUrl()).isEqualTo("https://cdn.example.com/a.jpg");
        assertThat(response.getItems().get(1).getRepresentativeImageUrl()).isEqualTo("https://poster.example.com/20.jpg");
    }

    private DiaryEntry diaryEntry(Long id, String photoUrls) {
        DiaryEntry entry = DiaryEntry.builder()
                .user(user(10L))
                .show(show(20L))
                .watchedDate(LocalDate.of(2026, 3, 1))
                .rating(5)
                .photoUrls(photoUrls)
                .isOpen(false)
                .build();
        ReflectionTestUtils.setField(entry, "id", id);
        return entry;
    }

    private DiaryRequest diaryRequest(List<String> photoUrls) {
        DiaryRequest request = new DiaryRequest();
        ReflectionTestUtils.setField(request, "showId", 20L);
        ReflectionTestUtils.setField(request, "watchedDate", LocalDate.of(2026, 3, 1));
        ReflectionTestUtils.setField(request, "rating", 5);
        ReflectionTestUtils.setField(request, "photoUrls", photoUrls);
        ReflectionTestUtils.setField(request, "isOpen", false);
        return request;
    }

    private User user(Long userId) {
        return User.builder()
                .id(userId)
                .nickname("테스터")
                .email("tester@example.com")
                .role(User.Role.USER)
                .build();
    }

    private Show show(Long showId) {
        return Show.builder()
                .id(showId)
                .kopisId("show-" + showId)
                .title("공연")
                .posterUrl("https://poster.example.com/" + showId + ".jpg")
                .build();
    }
}
