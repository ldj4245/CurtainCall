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
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * PlayDB에서 공연 출연진 정보를 크롤링하는 서비스.
 * 
 * 크롤링 정책:
 * - robots.txt 없음 (404) → 크롤링 제한 명시 없음
 * - 요청 간 2초 딜레이로 서버 부하 최소화
 * - 비상업적 목적의 데이터 가공 사용
 */
@Slf4j
@Service
public class PlaydbCrawlerService {

    private static final String PLAYDB_SEARCH_URL = "http://www.playdb.co.kr/playdb/playdbList.asp";
    private static final String PLAYDB_DETAIL_URL = "http://www.playdb.co.kr/playdb/PlaydbDetail.asp";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    private static final int TIMEOUT_MS = 15000;
    private static final Pattern GO_DETAIL_PATTERN = Pattern.compile("goDetail\\('(\\d+)'\\)");
    private static final Pattern PLAY_NO_PATTERN = Pattern.compile("[sS]Req[Pp]lay[Nn]o=(\\d+)");

    /**
     * PlayDB에서 해당 공연의 출연진 정보를 크롤링합니다.
     */
    public List<CastMember> crawlCasting(Show show) {
        try {
            // 1단계: 공연 제목으로 PlayDB 검색하여 공연 ID 찾기
            String playdbId = searchShow(show.getTitle());
            if (playdbId == null) {
                log.info("PlayDB에서 공연을 찾을 수 없음: {}", show.getTitle());
                return fallbackToKopis(show);
            }

            Thread.sleep(2000); // 예의 바른 크롤링 딜레이

            // 2단계: 출연진/제작진 탭에서 캐스팅 정보 파싱
            List<CastMember> members = parseCastTab(playdbId, show);

            if (members.isEmpty()) {
                log.info("PlayDB 출연진 파싱 결과 없음, KOPIS 데이터로 폴백: {}", show.getTitle());
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

    /**
     * PlayDB에서 공연 제목을 검색하여 첫 번째 결과의 공연 ID를 반환합니다.
     */
    private String searchShow(String title) throws IOException {
        // 제목에서 '뮤지컬' 같은 접두사 제거
        String cleanTitle = title.replaceAll("^(뮤지컬|연극)\\s*", "").trim();

        String searchUrl = PLAYDB_SEARCH_URL
                + "?sReqMainCategory=000001"
                + "&sReqTextType=0"
                + "&sReqText=" + URLEncoder.encode(cleanTitle, StandardCharsets.UTF_8);

        log.debug("PlayDB 검색 URL: {}", searchUrl);

        Document doc = Jsoup.connect(searchUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        // 방법 1: javascript:goDetail('221340') 패턴에서 ID 추출
        Elements allLinks = doc.select("a[href]");
        for (Element link : allLinks) {
            String href = link.attr("href");
            Matcher matcher = GO_DETAIL_PATTERN.matcher(href);
            if (matcher.find()) {
                String playNo = matcher.group(1);
                log.debug("PlayDB 공연 발견 (goDetail): {} → ID: {}", cleanTitle, playNo);
                return playNo;
            }
        }

        // 방법 2: PlaydbDetail.asp?sReqPlayNo=221340 패턴에서 ID 추출
        Elements detailLinks = doc.select("a[href*=PlaydbDetail], a[href*=playdbDetail]");
        for (Element link : detailLinks) {
            String href = link.attr("href");
            Matcher matcher = PLAY_NO_PATTERN.matcher(href);
            if (matcher.find()) {
                String playNo = matcher.group(1);
                log.debug("PlayDB 공연 발견 (URL param): {} → ID: {}", cleanTitle, playNo);
                return playNo;
            }
        }

        // 방법 3: onclick 속성에서 추출
        Elements clickableElements = doc.select("[onclick*=goDetail]");
        for (Element el : clickableElements) {
            Matcher matcher = GO_DETAIL_PATTERN.matcher(el.attr("onclick"));
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        log.info("PlayDB 검색 결과 없음: {}", cleanTitle);
        return null;
    }

    /**
     * PlayDB 출연진/제작진 탭(sReqTab=3)에서 배역별 배우 정보를 파싱합니다.
     *
     * PlayDB HTML 구조:
     * - 배역명: "라이토 역", "엘(L) 역" 등 텍스트
     * - 배우 링크: a[href*="artistdb/detail.asp?ManNo="]
     * - 배우 이미지: 해당 링크 내의 img 태그
     * - 배우 이름: 이미지 바로 옆 a 태그의 텍스트 또는 img alt
     */
    private List<CastMember> parseCastTab(String playdbId, Show show) throws IOException {
        String detailUrl = PLAYDB_DETAIL_URL + "?sReqPlayno=" + playdbId + "&sReqTab=3";
        log.debug("PlayDB 출연진 탭 URL: {}", detailUrl);

        Document doc = Jsoup.connect(detailUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        List<CastMember> members = new ArrayList<>();

        // 출연진 영역 찾기 - 본문 테이블/div 안에서 "역" 이 포함된 텍스트와 배우 링크를 탐색
        // PlayDB 구조: 배역명(텍스트) 다음에 배우 a 태그들이 나옴
        Elements artistLinks = doc.select("a[href*=artistdb]");

        if (artistLinks.isEmpty()) {
            // 대체: ManNo 파라미터가 있는 링크
            artistLinks = doc.select("a[href*=ManNo]");
        }

        if (artistLinks.isEmpty()) {
            log.info("PlayDB에서 출연진 링크를 찾을 수 없음: {}", show.getTitle());
            return members;
        }

        // 현재 배역명 추적
        String currentRole = "출연";

        // 배우 링크의 부모/이전 형제 노드에서 배역명 추출
        for (Element artistLink : artistLinks) {
            String actorName = extractActorName(artistLink);
            if (actorName.isEmpty() || actorName.equals("더보기"))
                continue;

            String imageUrl = extractActorImage(artistLink);

            // 이 배우 링크 이전에 나오는 "~역" 텍스트 찾기
            String foundRole = findRoleForActor(artistLink);
            if (foundRole != null && !foundRole.isEmpty()) {
                currentRole = foundRole;
            }

            // 중복 방지
            final String roleForDuplicateCheck = currentRole;
            boolean isDuplicate = members.stream()
                    .anyMatch(m -> m.getActorName().equals(actorName) && m.getRoleName().equals(roleForDuplicateCheck));

            if (!isDuplicate) {
                members.add(CastMember.builder()
                        .show(show)
                        .roleName(currentRole)
                        .actorName(actorName)
                        .actorImageUrl(imageUrl)
                        .playdbId(playdbId)
                        .build());
            }
        }

        log.info("PlayDB 파싱 완료: {} → {}역, {}명", show.getTitle(),
                members.stream().map(CastMember::getRoleName).distinct().count(),
                members.size());

        return members;
    }

    /**
     * 배우 링크에서 이름을 추출합니다.
     */
    private String extractActorName(Element artistLink) {
        // 링크 텍스트에서 이름 추출
        String text = artistLink.text().trim();
        if (!text.isEmpty() && !text.contains("http")) {
            return text;
        }

        // img alt 속성에서 추출
        Element img = artistLink.selectFirst("img");
        if (img != null) {
            String alt = img.attr("alt").trim();
            if (!alt.isEmpty())
                return alt;
        }

        // 바로 다음 형제 a 태그에서 이름 추출 (이미지 링크 -> 이름 링크 패턴)
        Element nextSibling = artistLink.nextElementSibling();
        if (nextSibling != null && "a".equals(nextSibling.tagName())) {
            String nextText = nextSibling.text().trim();
            if (!nextText.isEmpty())
                return nextText;
        }

        return "";
    }

    /**
     * 배우 링크에서 프로필 이미지 URL을 추출합니다.
     */
    private String extractActorImage(Element artistLink) {
        Element img = artistLink.selectFirst("img");
        if (img != null) {
            String src = img.absUrl("src");
            if (!src.isEmpty())
                return src;
            src = img.attr("src");
            if (!src.isEmpty()) {
                if (!src.startsWith("http")) {
                    return "http://www.playdb.co.kr" + (src.startsWith("/") ? "" : "/") + src;
                }
                return src;
            }
        }

        // 이전 형제에서 이미지 찾기 (이미지링크 -> 이름링크 패턴)
        Element prevSibling = artistLink.previousElementSibling();
        if (prevSibling != null && "a".equals(prevSibling.tagName())) {
            Element prevImg = prevSibling.selectFirst("img");
            if (prevImg != null) {
                String src = prevImg.absUrl("src");
                if (!src.isEmpty())
                    return src;
                src = prevImg.attr("src");
                if (!src.isEmpty() && !src.startsWith("http")) {
                    return "http://www.playdb.co.kr" + (src.startsWith("/") ? "" : "/") + src;
                }
            }
        }

        return null;
    }

    /**
     * 배우 링크 이전에 나오는 "~역" 텍스트를 찾아 배역명을 반환합니다.
     * PlayDB에서는 "라이토 역", "엘(L) 역" 등이 텍스트 노드로 존재합니다.
     */
    private String findRoleForActor(Element artistLink) {
        // 부모 요소의 자식들을 순회하면서 이 링크 이전에 나오는 "역" 텍스트 찾기
        Element parent = artistLink.parent();
        if (parent == null)
            return null;

        // 조상까지 올라가면서 역할 텍스트 탐색
        Element searchTarget = parent;
        for (int depth = 0; depth < 3; depth++) {
            String role = findRoleTextBeforeElement(searchTarget, artistLink);
            if (role != null)
                return role;

            // 이전 형제 노드에서 검색
            Element prev = searchTarget.previousElementSibling();
            while (prev != null) {
                String roleInPrev = extractRoleFromElement(prev);
                if (roleInPrev != null)
                    return roleInPrev;
                prev = prev.previousElementSibling();
            }

            searchTarget = searchTarget.parent();
            if (searchTarget == null)
                break;
        }

        return null;
    }

    /**
     * 특정 요소 이전에 나오는 "~역" 텍스트 찾기
     */
    private String findRoleTextBeforeElement(Element container, Element targetLink) {
        List<Node> children = container.childNodes();
        String lastRole = null;

        for (Node child : children) {
            if (child instanceof TextNode) {
                String text = ((TextNode) child).text().trim();
                if (text.endsWith("역") || text.contains(" 역")) {
                    lastRole = text.trim();
                }
            } else if (child instanceof Element) {
                Element el = (Element) child;
                // 타겟 링크에 도달하면 마지막으로 발견한 역할 반환
                if (el.equals(targetLink) || el.select("a").contains(targetLink)) {
                    return lastRole;
                }
                String text = el.ownText().trim();
                if (text.endsWith("역") || text.contains(" 역")) {
                    lastRole = text.trim();
                }
            }
        }

        return lastRole;
    }

    /**
     * 요소에서 "~역" 텍스트를 추출합니다.
     */
    private String extractRoleFromElement(Element element) {
        String text = element.ownText().trim();
        if (text.endsWith("역") || text.contains(" 역")) {
            return text;
        }

        // 하위 텍스트 노드 검사
        for (Node child : element.childNodes()) {
            if (child instanceof TextNode) {
                String childText = ((TextNode) child).text().trim();
                if (childText.endsWith("역") || childText.contains(" 역")) {
                    return childText;
                }
            }
        }

        return null;
    }

    /**
     * KOPIS castInfo를 기반으로 기본 출연진 목록 생성 (폴백)
     */
    private List<CastMember> fallbackToKopis(Show show) {
        if (show.getCastInfo() == null || show.getCastInfo().isEmpty()) {
            return List.of();
        }

        List<CastMember> members = new ArrayList<>();
        String[] actors = show.getCastInfo().split("[,/]");
        for (String actor : actors) {
            String name = actor.trim().replaceAll("\\s+등$", "");
            if (!name.isEmpty()) {
                members.add(CastMember.builder()
                        .show(show)
                        .roleName("출연")
                        .actorName(name)
                        .actorImageUrl(null)
                        .playdbId(null)
                        .build());
            }
        }
        return members;
    }
}
