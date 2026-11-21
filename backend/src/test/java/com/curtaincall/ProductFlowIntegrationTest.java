package com.curtaincall;

import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.curtaincall.domain.show.entity.Show;
import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.UserRepository;
import com.curtaincall.global.jwt.JwtTokenProvider;
import com.curtaincall.infra.kopis.KopisApiClient;
import com.curtaincall.infra.kopis.KopisSyncService;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.http.MediaType;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc @ActiveProfiles("test")
class ProductFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ShowRepository shows;
    @Autowired DiaryEntryRepository diaries;
    @Autowired JwtTokenProvider jwt;
    @MockBean KopisApiClient kopis;
    @MockBean KopisSyncService sync;
    User owner, other;
    Show show;
    String token, otherToken;
    final String image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

    @BeforeEach void seed() {
        owner = users.save(User.builder().nickname("작성자").email(UUID.randomUUID() + "@example.test").password("unused").build());
        other = users.save(User.builder().nickname("다른회원").email(UUID.randomUUID() + "@example.test").password("unused").build());
        show = shows.save(Show.builder().kopisId(UUID.randomUUID().toString().substring(0, 20)).title("통합 점검 공연 <안전>")
                .genre(Show.Genre.PLAY).startDate(LocalDate.now().minusYears(1)).endDate(LocalDate.now().plusDays(3)).dtguidance("토요일(14:00), 일요일(17:00)").build());
        token = jwt.createAccessToken(owner.getId(), owner.getEmail(), "USER");
        otherToken = jwt.createAccessToken(other.getId(), other.getEmail(), "USER");
    }
    Map<String, Object> record(boolean open) {
        var r = new HashMap<String, Object>();
        r.put("showId", show.getId()); r.put("watchedDate", LocalDate.now().toString()); r.put("isOpen", open);
        r.put("comment", "관람 기록 통합 점검 내용"); r.put("photoUrls", List.of(image));
        return r;
    }
    JsonNode request(MockHttpServletRequestBuilder r, String auth, Object body, int status) throws Exception {
        if (auth != null) r.header("Authorization", "Bearer " + auth);
        if (body != null) r.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        String data = mvc.perform(r).andExpect(status().is(status)).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return data.isBlank() ? json.nullNode() : json.readTree(data);
    }
    @Test void optionalRatingPhotosOwnershipAndRevocableSharing() throws Exception {
        var input = record(false);
        var entry = request(post("/api/diary"), token, input, 201);
        long id = entry.get("id").asLong();
        assertThat(entry.get("rating").isNull()).isTrue();
        assertThat(entry.get("photoUrls").size()).isEqualTo(1);
        assertThat(entry.get("photoUrls").get(0).asText()).isEqualTo(image);
        request(post("/api/diary/" + id + "/share"), token, null, 400);
        request(put("/api/diary/" + id), otherToken, input, 404);
        input.put("isOpen", true); input.put("hasSpoiler", true);
        request(put("/api/diary/" + id), token, input, 200);
        String path = request(post("/api/diary/" + id + "/share"), token, null, 200).get("path").asText();
        request(get("/api" + path), null, null, 200);
        mvc.perform(get(path)).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("noindex")));
        input.put("isOpen", false);
        request(put("/api/diary/" + id), token, input, 200);
        request(get("/api" + path), null, null, 404);
        input.put("isOpen", true); request(put("/api/diary/" + id), token, input, 200);
        request(get("/api" + path), null, null, 404);
        String newPath = request(post("/api/diary/" + id + "/share"), token, null, 200).get("path").asText();
        assertThat(newPath).isNotEqualTo(path);
        request(delete("/api/diary/" + id), token, null, 204);
        request(get("/api" + newPath), null, null, 404);
    }
    @Test void planCompletionIsAtomicAndCannotBeStolen() throws Exception {
        var p = Map.of("showId", show.getId(), "watchedDate", LocalDate.now().toString(), "reminder", true);
        long plan = request(post("/api/plans"), token, p, 200).get("id").asLong();
        var r = record(false); r.put("planId", plan);
        request(post("/api/diary"), otherToken, r, 404);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Callable<Long> save = () -> request(post("/api/diary"), token, r, 201).get("id").asLong();
            var results = pool.invokeAll(List.of(save, save));
            assertThat(results.get(0).get()).isEqualTo(results.get(1).get());
            assertThat(diaries.countByUserId(owner.getId())).isEqualTo(1);
        } finally { pool.shutdownNow(); }
        var list = request(get("/api/plans"), token, null, 200);
        assertThat(list.get(0).get("diaryId").isNull()).isFalse();
        request(put("/api/plans/" + plan), token, p, 400);
        request(delete("/api/diary/" + list.get(0).get("diaryId").asLong()), token, null, 204);
        assertThat(request(get("/api/plans"), token, null, 200).get(0).get("diaryId").isNull()).isTrue();
    }
    @Test void monthlyTotalsUseOnlyTheChosenMonthAndSeatSearchFindsOlderEntries() throws Exception {
        var now = LocalDate.now();
        var r = record(true); r.put("watchedDate", now.minusMonths(1).withDayOfMonth(1).toString());
        r.put("seatInfo", "2층 A구역 9열"); r.put("ticketPrice", 20000);
        request(post("/api/diary"), token, r, 201);
        r.put("watchedDate", now.toString()); r.put("seatInfo", ""); r.put("ticketPrice", 10000);
        for (int i = 0; i < 12; i++) request(post("/api/diary"), token, r, 201);
        var month = request(get("/api/diary/me/month").param("year", "" + now.getYear()).param("month", "" + now.getMonthValue()), token, null, 200);
        assertThat(month.get("count").asInt()).isEqualTo(12);
        assertThat(month.get("totalSpent").asInt()).isEqualTo(120000);
        var seats = request(get("/api/shows/" + show.getId() + "/public-records").param("seatsOnly", "true").param("seat", "2층"), null, null, 200);
        assertThat(seats.get("totalElements").asInt()).isEqualTo(1);
        assertThat(seats.get("content").get(0).get("representativeImageUrl").asText()).isEqualTo(image);
    }
    @Test void notificationsAreOptInAndDoNotDuplicateAndCommentsArePublic() throws Exception {
        var preferences = request(get("/api/notifications/preferences"), token, null, 200);
        assertThat(preferences.get("plans").asBoolean()).isFalse();
        request(post("/api/plans"), token, Map.of("showId", show.getId(), "watchedDate", LocalDate.now().toString(), "reminder", true), 200);
        assertThat(request(get("/api/notifications"), token, null, 200).size()).isZero();
        request(put("/api/notifications/preferences"), token, Map.of("plans", true, "favorites", true, "replies", true, "monthly", false), 200);
        assertThat(request(get("/api/notifications"), token, null, 200).size()).isEqualTo(1);
        assertThat(request(get("/api/notifications"), token, null, 200).size()).isEqualTo(1);
        var review = request(post("/api/shows/" + show.getId() + "/reviews"), token, Map.of("storyScore", 4, "castScore", 4, "directionScore", 4, "soundScore", 4, "content", "공개 댓글 통합 점검을 위한 후기 내용입니다."), 201);
        String comments = "/api/reviews/" + review.get("id").asLong() + "/comments";
        request(post(comments), otherToken, Map.of("content", "공개 댓글 테스트입니다."), 201);
        request(get(comments), null, null, 200);
        assertThat(request(get("/api/notifications"), token, null, 200).size()).isEqualTo(2);
        request(delete("/api/reviews/" + review.get("id").asLong()), token, null, 204);
        request(get(comments), null, null, 404);
    }
    @Test void metadataEndpointsWorkWithoutSpaInterception() throws Exception {
        mvc.perform(get("/shows/" + show.getId())).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("application/ld+json")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("&lt;안전&gt;")));
        mvc.perform(get("/robots.txt")).andExpect(status().isOk());
        mvc.perform(get("/sitemap.xml")).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("shared"))));
    }
    @Test void deletingAccountRevokesTokensPublicLinksAndErasesRecords() throws Exception {
        var entry = request(post("/api/diary"), token, record(true), 201);
        String path = request(post("/api/diary/" + entry.get("id").asLong() + "/share"), token, null, 200).get("path").asText();
        request(post("/api/plans"), token, Map.of("showId", show.getId(), "watchedDate", LocalDate.now().toString(), "reminder", true), 200);
        request(delete("/api/users/me"), token, Map.of("confirmation", "탈퇴"), 204);
        assertThat(users.findById(owner.getId()).orElseThrow().isDeactivated()).isTrue();
        assertThat(diaries.countByUserId(owner.getId())).isZero();
        request(get("/api/diary/me"), token, null, 401);
        request(get("/api" + path), null, null, 404);
    }

    @Test void onlyPublicRatingsAffectShowAverage() throws Exception {
        var privateRecord = record(false); privateRecord.put("rating", 5);
        request(post("/api/diary"), token, privateRecord, 201);
        var publicRecord = record(true); publicRecord.put("rating", 2);
        var saved = request(post("/api/diary"), token, publicRecord, 201);
        var detail = request(get("/api/shows/" + show.getId()), null, null, 200);
        assertThat(detail.get("averageScore").asDouble()).isEqualTo(2.0);
        assertThat(detail.get("ratingCount").asInt()).isEqualTo(1);
        publicRecord.put("isOpen", false);
        request(put("/api/diary/" + saved.get("id").asLong()), token, publicRecord, 200);
        detail = request(get("/api/shows/" + show.getId()), null, null, 200);
        assertThat(detail.get("averageScore").isNull()).isTrue();
    }

    @Test void legacyImageListsKeepTheDataUriComma() {
        String legacy = image + ",https://example.test/a,b.jpg," + image;
        var photos = com.curtaincall.domain.diary.dto.PhotoUrls.read(legacy);
        assertThat(photos).containsExactly(image, "https://example.test/a,b.jpg", image);
        assertThat(com.curtaincall.domain.diary.dto.PhotoUrls.read(com.curtaincall.domain.diary.dto.PhotoUrls.write(photos))).isEqualTo(photos);
    }

    @Test void favoritesIncludeShowsWithoutTheaterAndExportAndMetricsWork() throws Exception {
        request(post("/api/favorites/shows/" + show.getId()), token, null, 200);
        var favs = request(get("/api/favorites/my"), token, null, 200);
        assertThat(favs.get("totalElements").asLong()).isEqualTo(1L);
        assertThat(favs.get("content").get(0).get("id").asLong()).isEqualTo(show.getId());

        long planId = request(post("/api/plans"), token, Map.of("showId", show.getId(), "watchedDate", LocalDate.now().toString(), "reminder", true), 200).get("id").asLong();
        var recordBody = record(false);
        recordBody.put("planId", planId);
        request(post("/api/diary"), token, recordBody, 201);

        var exported = request(get("/api/diary/me/export"), token, null, 200);
        assertThat(exported.size()).isGreaterThanOrEqualTo(1);
        assertThat(exported.get(0).get("showTitle").asText()).contains("통합 점검 공연");

        request(post("/api/events"), token, Map.of("name", "show_view", "sessionId", UUID.randomUUID().toString(), "showId", show.getId()), 204);

        var admin = users.save(User.builder().nickname("관리자").email(UUID.randomUUID() + "@example.test").password("unused").role(User.Role.ADMIN).build());
        String adminToken = jwt.createAccessToken(admin.getId(), admin.getEmail(), "ADMIN");
        var metrics = request(get("/api/admin/metrics"), adminToken, null, 200);
        assertThat(metrics.get("plans").asLong()).isGreaterThanOrEqualTo(1L);
        assertThat(metrics.get("completedPlans").asLong()).isGreaterThanOrEqualTo(1L);
        assertThat(metrics.get("events90d").get("show_view").asLong()).isGreaterThanOrEqualTo(1L);
    }

    @Test void communityCrudLikesRepliesNotificationsAndAccountDeletion() throws Exception {
        request(get("/api/community/posts/my"), null, null, 401);
        request(get("/api/community/posts"), null, null, 200);

        var createBody = Map.of(
                "category", "INFO",
                "showId", show.getId(),
                "title", "관람 동선 정보 공유합니다",
                "content", "지하철역 출구에서 공연장까지 도보 이동 시간 정리입니다."
        );
        var created = request(post("/api/community/posts"), token, createBody, 201);
        long postId = created.get("id").asLong();
        assertThat(created.get("category").asText()).isEqualTo("INFO");
        assertThat(created.get("showId").asLong()).isEqualTo(show.getId());
        assertThat(created.get("author").asBoolean()).isTrue();

        var listed = request(get("/api/community/posts")
                .param("category", "INFO")
                .param("keyword", "통합 점검 공연"), null, null, 200);
        assertThat(listed.get("content")).anySatisfy(item ->
                assertThat(item.get("id").asLong()).isEqualTo(postId));

        var viewedOnce = request(get("/api/community/posts/" + postId), null, null, 200);
        assertThat(viewedOnce.get("viewCount").asInt()).isEqualTo(1);
        var viewedWithoutCount = request(get("/api/community/posts/" + postId)
                .param("countView", "false"), token, null, 200);
        assertThat(viewedWithoutCount.get("viewCount").asInt()).isEqualTo(1);

        var updateBody = Map.of(
                "category", "QUESTION",
                "showId", show.getId(),
                "title", "시야 관련 질문으로 수정합니다",
                "content", "1층 중블 앞열 시야가 어떤지 궁금합니다."
        );
        request(put("/api/community/posts/" + postId), otherToken, updateBody, 403);
        request(delete("/api/community/posts/" + postId), otherToken, null, 403);
        var updated = request(put("/api/community/posts/" + postId), token, updateBody, 200);
        assertThat(updated.get("category").asText()).isEqualTo("QUESTION");
        assertThat(updated.get("title").asText()).isEqualTo("시야 관련 질문으로 수정합니다");

        var likedOnce = request(post("/api/community/posts/" + postId + "/like"), otherToken, null, 200);
        assertThat(likedOnce.get("liked").asBoolean()).isTrue();
        assertThat(likedOnce.get("likeCount").asInt()).isEqualTo(1);
        var unliked = request(post("/api/community/posts/" + postId + "/like"), otherToken, null, 200);
        assertThat(unliked.get("liked").asBoolean()).isFalse();
        assertThat(unliked.get("likeCount").asInt()).isEqualTo(0);
        var reLiked = request(post("/api/community/posts/" + postId + "/like"), otherToken, null, 200);
        assertThat(reLiked.get("liked").asBoolean()).isTrue();
        assertThat(reLiked.get("likeCount").asInt()).isEqualTo(1);

        request(put("/api/notifications/preferences"), token,
                Map.of("plans", false, "favorites", false, "replies", true, "monthly", false), 200);

        var commentByOther = request(post("/api/community/posts/" + postId + "/comments"), otherToken,
                Map.of("content", "좋은 정보 감사합니다."), 201);
        long otherCommentId = commentByOther.get("id").asLong();

        var ownerComment = request(post("/api/community/posts/" + postId + "/comments"), token,
                Map.of("content", "추가 질문도 댓글로 남겨주세요."), 201);
        long ownerCommentId = ownerComment.get("id").asLong();

        var replyByOther = request(post("/api/community/posts/" + postId + "/comments"), otherToken,
                Map.of("content", "혹시 인터미션 시간도 아시나요?", "parentId", ownerCommentId), 201);
        long replyId = replyByOther.get("id").asLong();

        request(post("/api/community/posts/" + postId + "/comments"), token,
                Map.of("content", "대댓글의 대댓글 불가 확인", "parentId", replyId), 400);

        var notifications = request(get("/api/notifications"), token, null, 200);
        assertThat(notifications.size()).isEqualTo(2);
        assertThat(notifications.get(0).get("path").asText()).isEqualTo("/community/" + postId);

        var comments = request(get("/api/community/posts/" + postId + "/comments"), null, null, 200);
        assertThat(comments.get("content").size()).isEqualTo(2);
        assertThat(comments.get("content").get(1).get("replies").size()).isEqualTo(1);

        var admin = users.save(User.builder().nickname("커뮤니티관리자").email(UUID.randomUUID() + "@example.test")
                .password("unused").role(User.Role.ADMIN).build());
        String adminToken = jwt.createAccessToken(admin.getId(), admin.getEmail(), "ADMIN");
        request(delete("/api/community/comments/" + otherCommentId), adminToken, null, 204);

        var otherPost = request(post("/api/community/posts"), otherToken,
                Map.of("category", "FREE", "title", "다른 회원의 자유글입니다", "content", "오늘 관극 분위기 좋았습니다."), 201);
        long otherPostId = otherPost.get("id").asLong();
        var ownerLikedOther = request(post("/api/community/posts/" + otherPostId + "/like"), token, null, 200);
        assertThat(ownerLikedOther.get("likeCount").asInt()).isEqualTo(1);
        request(post("/api/community/posts/" + otherPostId + "/comments"), token,
                Map.of("content", "저도 공감합니다."), 201);

        request(delete("/api/users/me"), token, Map.of("confirmation", "탈퇴"), 204);

        request(get("/api/community/posts/" + postId), null, null, 404);
        var otherPostAfter = request(get("/api/community/posts/" + otherPostId).param("countView", "false"), null, null, 200);
        assertThat(otherPostAfter.get("likeCount").asInt()).isZero();
        var otherPostCommentsAfter = request(get("/api/community/posts/" + otherPostId + "/comments"), null, null, 200);
        assertThat(otherPostCommentsAfter.get("content").get(0).get("content").asText()).isEqualTo("[삭제된 댓글]");
        assertThat(otherPostCommentsAfter.get("content").get(0).get("authorNickname").asText()).isEqualTo("탈퇴한 회원");
    }
}
