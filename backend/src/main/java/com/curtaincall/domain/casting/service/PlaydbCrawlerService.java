package com.curtaincall.domain.casting.service;

import com.curtaincall.domain.casting.entity.CastMember;
import com.curtaincall.domain.show.entity.Show;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class PlaydbCrawlerService {

    private static final String PLAYDB_SEARCH_URL = "http://www.playdb.co.kr/playdb/playdbList.asp";
    private static final String PLAYDB_DETAIL_URL = "http://www.playdb.co.kr/playdb/PlaydbDetail.asp";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    private static final int TIMEOUT_MS = 30000;
    private static final Pattern GO_DETAIL_PATTERN = Pattern.compile("goDetail\\('(\\d+)'\\)");
    private static final Pattern PLAY_NO_PATTERN = Pattern.compile("[sS]Req[Pp]lay[Nn]o=(\\d+)");
    // "OO 역" 또는 "OO역" 패턴 (2~20글자 + 역)
    private static final Pattern ROLE_PATTERN = Pattern.compile("^(.{1,20})\\s*역\\s*$");

    public List<CastMember> crawlCasting(Show show) {
        try {
            String playdbId = searchShow(show.getTitle());
            if (playdbId == null) {
                log.info("PlayDB 검색 결과 없음: {}", show.getTitle());
                return fallbackToKopis(show);
            }
            Thread.sleep(2000);
            List<CastMember> members = parseCastTab(playdbId, show);
            if (members.isEmpty()) {
                log.info("PlayDB 파싱 결과 없음, KOPIS 폴백: {}", show.getTitle());
                return fallbackToKopis(show);
            }
            return members;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return fallbackToKopis(show);
        } catch (Exception e) {
            log.error("PlayDB 크롤링 실패 ({}): {}", show.getTitle(), e.getMessage());
            return fallbackToKopis(show);
        }
    }

    private String searchShow(String title) throws IOException {
        String cleanTitle = title.replaceAll("^(뮤지컬|연극)\\s*", "").trim();
        // 특수문자/부제 제거 (예: '데스노트(The Musical Death Note)' → '데스노트')
        cleanTitle = cleanTitle.replaceAll("\\(.*\\)", "").replaceAll("\\[.*\\]", "").trim();

        Document doc = Jsoup.connect(PLAYDB_SEARCH_URL
                + "?sReqMainCategory=000001&sReqTextType=0&sReqText="
                + URLEncoder.encode(cleanTitle, StandardCharsets.UTF_8))
                .userAgent(USER_AGENT).timeout(TIMEOUT_MS)
                .header("Accept-Encoding", "identity").get();

        // 검색 결과 컨테이너 내부의 결과만 취급 (좌측/상단 검색 랭킹 제외)
        // PlayDB 검색 결과 목록은 보통 id="contents" 내부에 있음
        Element contentArea = doc.getElementById("contents");
        if (contentArea == null) {
            contentArea = doc.body();
        }

        // goDetail('221340') 패턴에서 ID 추출
        for (Element link : contentArea.select("a[href*=goDetail], a[onclick*=goDetail]")) {
            Matcher m = GO_DETAIL_PATTERN.matcher(link.attr("href") + link.attr("onclick"));
            if (m.find())
                return m.group(1);
        }
        // PlaydbDetail URL에서 ID 추출
        for (Element link : contentArea.select("a[href*=PlaydbDetail]")) {
            Matcher m = PLAY_NO_PATTERN.matcher(link.attr("href"));
            if (m.find())
                return m.group(1);
        }
        return null;
    }

    /**
     * PlayDB 출연진 탭 파싱.
     *
     * 핵심 전략:
     * 1. "출연진" 이라는 텍스트를 가진 헤더 요소를 찾는다
     * 2. 그 헤더와 같은 레벨 또는 바로 다음에 나오는 콘텐츠를 파싱한다
     * 3. "~역" 텍스트를 찾으면 배역명으로 저장
     * 4. 바로 뒤에 나오는 artistdb 링크들을 해당 배역의 배우로 매핑
     * 5. "제작진" 텍스트를 만나면 파싱 종료
     */
    private List<CastMember> parseCastTab(String playdbId, Show show) throws IOException {
        Document doc = Jsoup.connect(PLAYDB_DETAIL_URL + "?sReqPlayno=" + playdbId + "&sReqTab=3")
                .userAgent(USER_AGENT).timeout(TIMEOUT_MS)
                .header("Accept-Encoding", "identity").get();

        // 전략: 전체 body의 단순 텍스트+링크 순서를 이용
        // body에서 모든 텍스트노드와 a 태그를 순서대로 추출
        List<Object> sequence = extractSequence(doc.body());

        // "출연진" 텍스트 이후 ~ "제작진" 텍스트 이전 범위만 처리
        int castStart = -1;
        int castEnd = sequence.size();

        for (int i = 0; i < sequence.size(); i++) {
            if (sequence.get(i) instanceof String) {
                String text = ((String) sequence.get(i)).trim()
                        .replaceAll("\\s+", ""); // 공백/특수 공백 제거
                if (castStart == -1 && text.contains("출연진")) {
                    castStart = i;
                } else if (castStart >= 0 && text.contains("제작진")) {
                    castEnd = i;
                    break;
                }
            }
        }

        if (castStart == -1) {
            log.warn("출연진 섹션 못 찾음: {}", show.getTitle());
            return List.of();
        }

        log.info("출연진 범위: {} ~ {} (전체 {})", castStart, castEnd, sequence.size());

        // 출연진 범위에서 배역-배우 매핑
        Map<String, List<ActorData>> roleMap = new LinkedHashMap<>();
        String currentRole = "출연";

        for (int i = castStart + 1; i < castEnd; i++) {
            Object item = sequence.get(i);

            if (item instanceof String) {
                String text = ((String) item).trim();
                Matcher roleMatcher = ROLE_PATTERN.matcher(text);
                if (roleMatcher.matches()) {
                    currentRole = text;
                    log.debug("배역: {}", currentRole);
                }
            } else if (item instanceof ActorLink) {
                ActorLink link = (ActorLink) item;
                // 메뉴 텍스트 필터링
                if (!isMenuText(link.name)) {
                    roleMap.computeIfAbsent(currentRole, k -> new ArrayList<>())
                            .add(new ActorData(link.name, link.imageUrl));
                }
            }
        }

        // CastMember 엔티티로 변환
        List<CastMember> members = new ArrayList<>();
        for (Map.Entry<String, List<ActorData>> entry : roleMap.entrySet()) {
            for (ActorData actor : entry.getValue()) {
                members.add(CastMember.builder()
                        .show(show)
                        .roleName(entry.getKey())
                        .actorName(actor.name)
                        .actorImageUrl(actor.imageUrl)
                        .playdbId(playdbId)
                        .build());
            }
        }

        log.info("파싱 완료: {} → {}배역, {}명", show.getTitle(),
                roleMap.size(), members.size());
        return members;
    }

    /**
     * HTML body를 순서대로 순회하면서 텍스트와 배우 링크를 추출합니다.
     * 배우 링크: href에 artistdb가 포함되고, 텍스트(이름)가 있는 a 태그
     * 이미지 링크: href에 artistdb가 포함되고, img를 포함하는 a 태그 (이름 링크 직전에 나옴)
     */
    private List<Object> extractSequence(Element root) {
        List<Object> result = new ArrayList<>();
        String pendingImageUrl = null;

        for (Node node : collectAllNodes(root)) {
            if (node instanceof TextNode) {
                String text = ((TextNode) node).text().trim();
                if (!text.isEmpty()) {
                    result.add(text);
                }
            } else if (node instanceof Element) {
                Element el = (Element) node;
                if ("img".equals(el.tagName())) {
                    String alt = el.attr("alt").trim();
                    if (!alt.isEmpty()) {
                        result.add(alt);
                    }
                } else if ("a".equals(el.tagName()) && el.attr("href").contains("artistdb")) {
                    Element img = el.selectFirst("img");
                    if (img != null) {
                        // 이미지 링크: URL만 저장하고 이름은 처리 안함 (중복 방지)
                        pendingImageUrl = resolveImageUrl(img);
                    } else {
                        // 텍스트(이름) 링크: 저장된 이미지 URL과 결합
                        String name = el.ownText().trim();
                        if (name.isEmpty()) {
                            name = el.text().trim();
                        }
                        if (!name.isEmpty() && name.length() <= 20) {
                            result.add(new ActorLink(name, pendingImageUrl));
                            pendingImageUrl = null; // 사용 후 초기화
                        }
                    }
                }
            }
        }
        return result;
    }

    /**
     * 깊이 우선으로 모든 자식 노드를 수집 (재귀)
     */
    private List<Node> collectAllNodes(Element root) {
        List<Node> nodes = new ArrayList<>();
        collectHelper(root, nodes);
        return nodes;
    }

    private void collectHelper(Node node, List<Node> result) {
        if (node instanceof Element) {
            Element el = (Element) node;
            if ("a".equals(el.tagName()) || "img".equals(el.tagName())) {
                // a와 img 태그는 통째로 추가하고, a의 경우 자식 재귀 안 함
                result.add(node);
                if ("img".equals(el.tagName()))
                    return; // img는 자식 없음
                if ("a".equals(el.tagName()))
                    return;
            }
        }
        for (Node child : node.childNodes()) {
            if (child instanceof TextNode) {
                result.add(child);
            } else if (child instanceof Element) {
                collectHelper(child, result);
            }
        }
    }

    private boolean isMenuText(String text) {
        if (text == null || text.length() > 20)
            return false;
        String[] menuWords = { "인물DB", "뮤지컬 배우", "연극 배우", "뮤지션", "클래식 뮤지션",
                "성악가", "국악인", "무용인", "예술단체", "제작스태프", "기획스태프",
                "직종별 전체보기", "뮤지컬배우", "연극배우", "클래식뮤지션", "더보기",
                "캐릭터 보기", "리스트 보기" };
        for (String w : menuWords) {
            if (text.equals(w))
                return true;
        }
        return false;
    }

    private String resolveImageUrl(Element img) {
        String src = img.absUrl("src");
        if (!src.isEmpty())
            return src;
        src = img.attr("src");
        if (src.isEmpty())
            return null;
        if (!src.startsWith("http")) {
            return "http://www.playdb.co.kr" + (src.startsWith("/") ? "" : "/") + src;
        }
        return src;
    }

    private List<CastMember> fallbackToKopis(Show show) {
        if (show.getCastInfo() == null || show.getCastInfo().isEmpty())
            return List.of();
        List<CastMember> members = new ArrayList<>();
        for (String actor : show.getCastInfo().split("[,/]")) {
            String name = actor.trim().replaceAll("\\s+등$", "");
            if (!name.isEmpty() && name.length() <= 20) {
                members.add(CastMember.builder()
                        .show(show).roleName("출연").actorName(name)
                        .actorImageUrl(null).playdbId(null).build());
            }
        }
        return members;
    }

    // 내부 데이터 클래스
    private static class ActorLink {
        final String name;
        final String imageUrl;

        ActorLink(String name, String imageUrl) {
            this.name = name;
            this.imageUrl = imageUrl;
        }
    }

    private static class ActorData {
        final String name;
        final String imageUrl;

        ActorData(String name, String imageUrl) {
            this.name = name;
            this.imageUrl = imageUrl;
        }
    }
}
