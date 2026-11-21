package com.curtaincall.domain.notification;

import com.curtaincall.domain.plan.ViewingPlanRepository;
import com.curtaincall.domain.favorite.repository.FavoriteShowRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import java.time.*;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class NotificationService {
    private final NotificationRepository notifications;
    private final NotificationPreferenceRepository preferences;
    private final ViewingPlanRepository plans;
    private final FavoriteShowRepository favorites;
    private final UserRepository users;
    // Locking the owner's row serializes refresh and preference creation across tabs/requests.
    public NotificationPreference preference(Long user) {
        users.lockById(user).orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        return preferences.findById(user).orElseGet(() -> preferences.save(new NotificationPreference(user)));
    }
    public List<Notification> list(Long user) {
        var p = preference(user);
        var today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        if (p.isPlans()) for (var plan : plans.findByUserIdOrderByWatchedDateAscWatchedTimeAsc(user)) {
            if (!plan.isReminder() || plan.getDiaryId() != null) continue;
            if (plan.getWatchedDate().equals(today) || plan.getWatchedDate().equals(today.plusDays(1)))
                add(user, "plan:" + plan.getId() + ":" + plan.getWatchedDate(), plan.getShow().getTitle() + " · " + plan.getWatchedDate() + " 관람 예정", "/plans");
            else if (plan.getWatchedDate().isBefore(today) && !plan.getWatchedDate().isBefore(today.minusDays(7)))
                add(user, "record:" + plan.getId() + ":" + plan.getWatchedDate(), plan.getShow().getTitle() + " 관람 기록 남기기", "/plans");
        }
        if (p.isFavorites()) for (var f : favorites.findByUserId(user)) {
            var end = f.getShow().getEndDate();
            if (end != null && !end.isBefore(today) && !end.isAfter(today.plusDays(7)))
                add(user, "ending:" + f.getShow().getId() + ":" + end, f.getShow().getTitle() + " · " + end + " 공연 종료", "/shows/" + f.getShow().getId());
        }
        if (p.isMonthly()) add(user, "month:" + YearMonth.from(today), today.minusMonths(1).getMonthValue() + "월 관람 기록 보기", "/diary?month=" + YearMonth.from(today.minusMonths(1)));
        return notifications.findByUserIdOrderByCreatedAtDesc(user, PageRequest.of(0, 50));
    }
    public void reply(Long owner, Long writer, Long commentId, Long showId) {
        if (owner.equals(writer)) return;
        var p = preference(owner);
        if (p.isReplies()) add(owner, "reply:" + commentId, "작성한 후기에 댓글이 달렸습니다.", "/shows/" + showId + "?tab=reviews");
    }
    public void seen(Long user, Long id) {
        notifications.findByIdAndUserId(id, user).orElseThrow(() -> BusinessException.notFound("알림을 찾을 수 없습니다.")).markSeen();
    }
    private void add(Long user, String key, String title, String path) {
        if (!notifications.existsByUserIdAndEventKey(user, key)) notifications.save(Notification.builder().userId(user).eventKey(key).title(title).path(path).build());
    }
}
