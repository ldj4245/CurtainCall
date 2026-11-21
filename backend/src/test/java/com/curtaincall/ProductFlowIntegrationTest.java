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
    @org.springframework.boot.test.web.server.LocalServerPort int port;
    @Autowired com.curtaincall.domain.companion.repository.CompanionPostRepository posts;
    @Autowired com.curtaincall.domain.companion.repository.CompanionParticipantRepository participants;
    @Autowired com.curtaincall.domain.chat.repository.ChatRoomRepository rooms;
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
        String data = mvc.perform(r).andExpect(status().is(status)).andReturn().getResponse().getContentAsString();
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
    @Test void websocketInfoAndMetadataWorkWithoutSpaInterception() throws Exception {
        mvc.perform(get("/ws/info")).andExpect(status().isOk()).andExpect(jsonPath("websocket").value(true));
        mvc.perform(get("/shows/" + show.getId())).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("application/ld+json")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("&lt;안전&gt;")));
        mvc.perform(get("/robots.txt")).andExpect(status().isOk());
        mvc.perform(get("/sitemap.xml")).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("shared"))));
    }
    @Test void deletingAccountRevokesTokensPublicLinksAndErasesRecords() throws Exception {
        var authored = posts.save(com.curtaincall.domain.companion.entity.CompanionPost.builder().author(owner).show(show)
            .title("탈퇴 점검").content("삭제될 동행 내용").performanceDate(LocalDate.now()).performanceTime("14:00").maxMembers(3).build());
        participants.save(com.curtaincall.domain.companion.entity.CompanionParticipant.builder().companionPost(authored).user(owner).build());
        rooms.save(com.curtaincall.domain.chat.entity.ChatRoom.of(authored));
        var entry = request(post("/api/diary"), token, record(true), 201);
        String path = request(post("/api/diary/" + entry.get("id").asLong() + "/share"), token, null, 200).get("path").asText();
        request(post("/api/plans"), token, Map.of("showId", show.getId(), "watchedDate", LocalDate.now().toString(), "reminder", true), 200);
        request(delete("/api/users/me"), token, Map.of("confirmation", "탈퇴"), 204);
        assertThat(users.findById(owner.getId()).orElseThrow().isDeactivated()).isTrue();
        assertThat(diaries.countByUserId(owner.getId())).isZero();
        request(get("/api/diary/me"), token, null, 401);
        request(get("/api" + path), null, null, 404);
        assertThat(posts.existsById(authored.getId())).isFalse();
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

    @Test void websocketRequiresAuthenticationAndMembershipAndRespectsBlock() throws Exception {
        var post = posts.save(com.curtaincall.domain.companion.entity.CompanionPost.builder().author(owner).show(show)
            .title("동행 점검").content("동행 내용").performanceDate(LocalDate.now()).performanceTime("14:00").maxMembers(3).build());
        participants.save(com.curtaincall.domain.companion.entity.CompanionParticipant.builder().companionPost(post).user(owner).build());
        var room = rooms.save(com.curtaincall.domain.chat.entity.ChatRoom.of(post));
        var client = new org.springframework.web.socket.messaging.WebSocketStompClient(new org.springframework.web.socket.sockjs.client.SockJsClient(
            List.of(new org.springframework.web.socket.sockjs.client.WebSocketTransport(new org.springframework.web.socket.client.standard.StandardWebSocketClient()))));
        client.setMessageConverter(new org.springframework.messaging.converter.MappingJackson2MessageConverter());
        var headers = new org.springframework.web.socket.WebSocketHttpHeaders(); headers.add("Origin", "http://localhost:3000");
        var ownerHeaders = new org.springframework.messaging.simp.stomp.StompHeaders(); ownerHeaders.add("Authorization", "Bearer " + token);
        var otherHeaders = new org.springframework.messaging.simp.stomp.StompHeaders(); otherHeaders.add("Authorization", "Bearer " + otherToken);
        try {
            assertThatThrownBy(() -> client.connectAsync("http://localhost:" + port + "/ws", headers,
                new org.springframework.messaging.simp.stomp.StompHeaders(), new org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS)).isInstanceOf(Exception.class);
            var denied = new CountDownLatch(1);
            var outsider = client.connectAsync("http://localhost:" + port + "/ws", headers, otherHeaders,
                new org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter() {
                    @Override public void handleFrame(org.springframework.messaging.simp.stomp.StompHeaders h, Object payload) { denied.countDown(); }
                    @Override public void handleTransportError(org.springframework.messaging.simp.stomp.StompSession s, Throwable e) { denied.countDown(); }
                }).get(5, TimeUnit.SECONDS);
            outsider.subscribe("/sub/chat/" + room.getId(), new org.springframework.messaging.simp.stomp.StompFrameHandler() {
                public java.lang.reflect.Type getPayloadType(org.springframework.messaging.simp.stomp.StompHeaders h) { return Map.class; }
                public void handleFrame(org.springframework.messaging.simp.stomp.StompHeaders h, Object payload) {}
            });
            assertThat(denied.await(5, TimeUnit.SECONDS)).isTrue();
            var received = new LinkedBlockingQueue<Map<?, ?>>();
            var member = client.connectAsync("http://localhost:" + port + "/ws", headers, ownerHeaders,
                new org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
            member.subscribe("/sub/chat/" + room.getId(), new org.springframework.messaging.simp.stomp.StompFrameHandler() {
                public java.lang.reflect.Type getPayloadType(org.springframework.messaging.simp.stomp.StompHeaders h) { return Map.class; }
                public void handleFrame(org.springframework.messaging.simp.stomp.StompHeaders h, Object payload) { received.add((Map<?, ?>) payload); }
            });
            member.send("/pub/chat/" + room.getId(), Map.of("content", "연결 확인", "type", "TALK"));
            var message = received.poll(5, TimeUnit.SECONDS);
            assertThat(message).isNotNull(); assertThat(message.get("content")).isEqualTo("연결 확인");
            participants.save(com.curtaincall.domain.companion.entity.CompanionParticipant.builder().companionPost(post).user(other).build());
            request(put("/api/blocks/" + other.getId()), token, null, 200);
            var writer = client.connectAsync("http://localhost:" + port + "/ws", headers, otherHeaders,
                new org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
            writer.send("/pub/chat/" + room.getId(), Map.of("content", "차단된 메시지", "type", "TALK"));
            assertThat(received.poll(1, TimeUnit.SECONDS)).isNull();
            writer.disconnect(); member.disconnect();
        } finally { client.stop(); }
    }
}
