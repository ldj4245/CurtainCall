package com.curtaincall.domain.user.service;

import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.domain.diary.dto.PhotoUrls;
import com.curtaincall.domain.companion.service.CompanionService;
import com.curtaincall.global.exception.BusinessException;
import com.curtaincall.global.infra.storage.ImageUploadService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class AccountDataService {
    private final EntityManager em;
    private final UserRepository users;
    private final CompanionService companions;
    private final ImageUploadService images;
    private final org.springframework.cache.CacheManager caches;

    @Transactional public void erase(Long id) {
        var user = users.lockById(id).orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
        List<String> photos = new ArrayList<>();
        for (Object stored : em.createNativeQuery("select photo_urls from diary_entries where user_id = :id").setParameter("id", id).getResultList())
            if (stored != null) photos.addAll(PhotoUrls.read(stored.toString()));
        var authored = em.createQuery("select p.id from CompanionPost p where p.author.id = :id", Long.class).setParameter("id", id).getResultList();
        for (Long post : authored) companions.deleteCompanion(post, id);
        // Clear the remaining participations while keeping the other participants' rooms.
        var participation = em.createQuery("select p from CompanionParticipant p join fetch p.companionPost where p.user.id = :id", com.curtaincall.domain.companion.entity.CompanionParticipant.class).setParameter("id", id).getResultList();
        for (var p : participation) { p.getCompanionPost().decrementMembers(); em.remove(p); }
        em.flush();
        for (String statement : List.of(
            "delete from viewing_plans where user_id = :id",
            "delete from favorite_shows where user_id = :id",
            "delete from notifications where user_id = :id",
            "delete from notification_preferences where user_id = :id",
            "delete from user_blocks where user_id = :id or blocked_user_id = :id",
            "update product_events set user_id = null where user_id = :id",
            "delete from diary_entries where user_id = :id",
            "update reviews set like_count = greatest(like_count - 1, 0) where id in (select review_id from review_likes where user_id = :id)",
            "delete from review_likes where user_id = :id",
            "update reviews set content = '', deleted_at = CURRENT_TIMESTAMP where user_id = :id",
            "update review_comments set content = '[삭제된 댓글]' where user_id = :id",
            "update chat_messages set content = '[삭제된 메시지]' where sender_id = :id",
            "update show_live_messages set content = '[삭제된 메시지]' where sender_id = :id"))
            em.createNativeQuery(statement).setParameter("id", id).executeUpdate();
        user.deactivate();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                photos.forEach(url -> images.deleteOwnedDiaryImage(url, id));
                for (String name : caches.getCacheNames()) { var cache = caches.getCache(name); if (cache != null) cache.clear(); }
            }
        });
    }
}
