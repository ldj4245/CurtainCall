package com.curtaincall.domain.plan;

import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class ViewingPlanService {
    private final ViewingPlanRepository plans;
    private final ShowRepository shows;
    private final UserRepository users;
    public record Request(@NotNull Long showId, @NotNull LocalDate watchedDate, LocalTime watchedTime,
                          @Size(max = 100) String seatInfo, @Size(max = 500) String memo, boolean reminder) {}
    public record Response(Long id, Long showId, String showTitle, String posterUrl, String theaterName,
                           LocalDate watchedDate, LocalTime watchedTime, String seatInfo, String memo,
                           boolean reminder, Long diaryId) {
        public static Response from(ViewingPlan p) {
            return new Response(p.getId(), p.getShow().getId(), p.getShow().getTitle(), p.getShow().getPosterUrl(),
                p.getShow().getTheater() == null ? null : p.getShow().getTheater().getName(), p.getWatchedDate(),
                p.getWatchedTime(), p.getSeatInfo(), p.getMemo(), p.isReminder(), p.getDiaryId());
        }
    }
    public List<Response> list(Long userId) { return plans.findByUserIdOrderByWatchedDateAscWatchedTimeAsc(userId).stream().map(Response::from).toList(); }
    @Transactional public Response save(Long userId, Long id, Request r) {
        var show = shows.findById(r.showId()).orElseThrow(() -> BusinessException.notFound("공연을 찾을 수 없습니다."));
        if ((show.getStartDate() != null && r.watchedDate().isBefore(show.getStartDate())) ||
            (show.getEndDate() != null && r.watchedDate().isAfter(show.getEndDate())))
            throw BusinessException.badRequest("공연 기간 안의 날짜를 선택해 주세요.");
        var p = id == null ? ViewingPlan.builder().user(users.getReferenceById(userId)).show(show).build() : owned(id, userId);
        if (p.getDiaryId() != null) throw BusinessException.badRequest("기록으로 옮긴 일정입니다.");
        if (!p.getShow().getId().equals(r.showId())) throw BusinessException.badRequest("일정의 공연은 변경할 수 없습니다.");
        p.update(r.watchedDate(), r.watchedTime(), r.seatInfo(), r.memo(), r.reminder());
        return Response.from(plans.save(p));
    }
    @Transactional public void delete(Long userId, Long id) { plans.delete(owned(id, userId)); }
    @Transactional public void restoreDeletedRecord(Long userId, Long diaryId) {
        plans.findByUserIdAndDiaryId(userId, diaryId).forEach(p -> p.complete(null));
    }
    public ViewingPlan owned(Long id, Long userId) {
        return plans.lockOwned(id, userId).orElseThrow(() -> BusinessException.notFound("일정을 찾을 수 없습니다."));
    }
}
