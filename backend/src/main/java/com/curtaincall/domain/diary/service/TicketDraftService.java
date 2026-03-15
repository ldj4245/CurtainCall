package com.curtaincall.domain.diary.service;

import com.curtaincall.domain.diary.dto.TicketDraftResponse;
import com.curtaincall.domain.diary.dto.TicketDraftShowDto;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TicketDraftService {

    private final TicketDraftExtractor ticketDraftExtractor;
    private final ShowRepository showRepository;

    public TicketDraftResponse createDraft(MultipartFile file) {
        validateImage(file);

        TicketDraftExtractionResult extracted = ticketDraftExtractor.extract(file);
        List<ScoredShow> scoredShows = findCandidates(extracted);
        TicketDraftShowDto matchedShow = pickMatchedShow(scoredShows);
        List<TicketDraftShowDto> suggestions = scoredShows.stream()
                .limit(3)
                .map(scored -> TicketDraftShowDto.from(scored.show()))
                .toList();

        return TicketDraftResponse.builder()
                .matchedShow(matchedShow)
                .suggestions(matchedShow == null ? suggestions : suggestions.stream()
                        .filter(candidate -> !candidate.getId().equals(matchedShow.getId()))
                        .toList())
                .watchedDate(extracted.watchedDate())
                .performanceTime(extracted.performanceTime())
                .theaterName(extracted.theaterName())
                .seatInfo(extracted.seatInfo())
                .ticketPrice(extracted.ticketPrice())
                .confidence(extracted.confidence())
                .warnings(extracted.warnings())
                .build();
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("티켓 이미지가 비어 있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw BusinessException.badRequest("이미지 파일만 업로드할 수 있습니다.");
        }
    }

    private List<ScoredShow> findCandidates(TicketDraftExtractionResult extracted) {
        if (extracted.showTitle() == null || extracted.showTitle().isBlank()) {
            return List.of();
        }

        return showRepository.findByTitleContaining(extracted.showTitle(), PageRequest.of(0, 8)).stream()
                .map(show -> new ScoredShow(show, calculateScore(show, extracted)))
                .sorted(Comparator.comparingInt(ScoredShow::score).reversed())
                .toList();
    }

    private int calculateScore(Show show, TicketDraftExtractionResult extracted) {
        String normalizedTitle = normalize(extracted.showTitle());
        String showTitle = normalize(show.getTitle());
        int score = 0;

        if (showTitle.equals(normalizedTitle)) {
            score += 100;
        } else if (showTitle.contains(normalizedTitle) || normalizedTitle.contains(showTitle)) {
            score += 70;
        }

        String extractedTheater = normalize(extracted.theaterName());
        String showTheater = normalize(show.getTheater() != null ? show.getTheater().getName() : null);
        if (!extractedTheater.isBlank() && !showTheater.isBlank()) {
            if (showTheater.equals(extractedTheater)) {
                score += 20;
            } else if (showTheater.contains(extractedTheater) || extractedTheater.contains(showTheater)) {
                score += 12;
            }
        }

        score += calculateDateScore(show, extracted.watchedDate());
        return score;
    }

    private int calculateDateScore(Show show, LocalDate watchedDate) {
        if (watchedDate == null) {
            return 0;
        }
        if (show.getStartDate() != null && show.getEndDate() != null
                && !watchedDate.isBefore(show.getStartDate())
                && !watchedDate.isAfter(show.getEndDate())) {
            return 25;
        }
        if (show.getStartDate() != null) {
            long distance = Math.abs(ChronoUnit.DAYS.between(show.getStartDate(), watchedDate));
            return (int) Math.max(0, 10 - Math.min(distance, 10));
        }
        return 0;
    }

    private TicketDraftShowDto pickMatchedShow(List<ScoredShow> scoredShows) {
        if (scoredShows.isEmpty()) {
            return null;
        }

        ScoredShow first = scoredShows.get(0);
        int secondScore = scoredShows.size() > 1 ? scoredShows.get(1).score() : -1;
        if (first.score() >= 85 && first.score() - secondScore >= 12) {
            return TicketDraftShowDto.from(first.show());
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^a-z0-9가-힣]", "");
    }

    private record ScoredShow(Show show, int score) {
    }
}
