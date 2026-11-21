package com.curtaincall.domain.notification;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "notification_preferences") @Getter @NoArgsConstructor
public class NotificationPreference {
    @Id private Long userId;
    private boolean plans;
    private boolean favorites;
    private boolean replies;
    private boolean monthly;
    public NotificationPreference(Long id) { userId = id; }
    public void update(boolean p, boolean f, boolean r, boolean m) { plans = p; favorites = f; replies = r; monthly = m; }
}
