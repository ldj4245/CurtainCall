package com.curtaincall.domain.diary.service;

import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.theater.entity.Theater;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketDraftServiceTest {

    @Mock
    private TicketDraftExtractor ticketDraftExtractor;

    @Mock
    private ShowRepository showRepository;

    private TicketDraftService ticketDraftService;

    @BeforeEach
    void setUp() {
        ticketDraftService = new TicketDraftService(ticketDraftExtractor, showRepository);
    }

    @Test
    void createDraftMatchesSingleStrongShow() {
        MockMultipartFile file = new MockMultipartFile("file", "ticket.png", "image/png", new byte[]{1, 2, 3});
        TicketDraftExtractionResult extracted = TicketDraftExtractionResult.builder()
                .showTitle("지킬앤하이드")
                .theaterName("블루스퀘어")
                .watchedDate(LocalDate.of(2026, 3, 10))
                .performanceTime(LocalTime.of(19, 30))
                .seatInfo("1층 B구역 3열 8번")
                .ticketPrice(150000)
                .confidence(0.92)
                .warnings(List.of())
                .build();

        Show matched = show(10L, "지킬앤하이드", "블루스퀘어", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 4, 30));
        Show other = show(11L, "지킬앤하이드 월드투어", "예술의전당", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 20));

        when(ticketDraftExtractor.extract(file)).thenReturn(extracted);
        when(showRepository.findByTitleContaining("지킬앤하이드", PageRequest.of(0, 8))).thenReturn(List.of(matched, other));

        var response = ticketDraftService.createDraft(file);

        assertThat(response.getMatchedShow()).isNotNull();
        assertThat(response.getMatchedShow().getId()).isEqualTo(10L);
        assertThat(response.getSuggestions()).hasSize(1);
        assertThat(response.getWatchedDate()).isEqualTo(LocalDate.of(2026, 3, 10));
        assertThat(response.getPerformanceTime()).isEqualTo(LocalTime.of(19, 30));
        assertThat(response.getSeatInfo()).isEqualTo("1층 B구역 3열 8번");
    }

    @Test
    void createDraftReturnsSuggestionsWhenMatchIsAmbiguous() {
        MockMultipartFile file = new MockMultipartFile("file", "ticket.png", "image/png", new byte[]{1, 2, 3});
        TicketDraftExtractionResult extracted = TicketDraftExtractionResult.builder()
                .showTitle("햄릿")
                .theaterName("예술의전당")
                .watchedDate(LocalDate.of(2026, 3, 10))
                .confidence(0.61)
                .warnings(List.of("공연명이 흐리게 보여 후보를 함께 제안합니다."))
                .build();

        Show first = show(20L, "햄릿", "예술의전당", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 31));
        Show second = show(21L, "햄릿", "예술의전당", LocalDate.of(2026, 2, 10), LocalDate.of(2026, 4, 10));

        when(ticketDraftExtractor.extract(file)).thenReturn(extracted);
        when(showRepository.findByTitleContaining("햄릿", PageRequest.of(0, 8))).thenReturn(List.of(first, second));

        var response = ticketDraftService.createDraft(file);

        assertThat(response.getMatchedShow()).isNull();
        assertThat(response.getSuggestions()).hasSize(2);
        assertThat(response.getWarnings()).contains("공연명이 흐리게 보여 후보를 함께 제안합니다.");
    }

    private Show show(Long id, String title, String theaterName, LocalDate startDate, LocalDate endDate) {
        Theater theater = Theater.builder()
                .kopisId("theater-" + id)
                .name(theaterName)
                .build();

        Show show = Show.builder()
                .kopisId("show-" + id)
                .title(title)
                .startDate(startDate)
                .endDate(endDate)
                .theater(theater)
                .build();
        ReflectionTestUtils.setField(show, "id", id);
        return show;
    }
}
