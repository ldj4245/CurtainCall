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
 */
@Slf4j
@Service
public class PlaydbCrawlerService {

    private static final String PLAYDB_SEARCH_URL = "http://www.playdb.co.kr/playdb/playdbList.asp";
    private static final String PLAYDB_DETAIL_URL = "http://www.playdb.co.kr/playdb/PlaydbDetail.asp";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    private static final int TIMEOUT_MS = 30000;
    private static final Pattern GO_DETAIL_PATTERN = Pattern.compile("goDetail\\('(\\d+)'\\)");
    private static final Pattern PLAY_NO_PATTERN = Pattern.compile("[sS]Req[Pp]lay[Nn]o=(\\d+)");

    public List<CastMember> crawlCasting(Show show) {
        try {
            String playdbId = searchShow(show.getTitle());
            if (playdbId == null) {
                log.info("PlayDB에서 공연을 찾을 수 없음: {}", show.getTitle());
                return fallbackToKopis(show);
            }

            Thread.sleep(2000);

            List<CastMember> members = parseCastTab(playdbId, show);
            if (members.isEmpty()) {
                log.info("PlayDB 출연진 파싱 결과 없음, KOPIS 폴백: {}", show.getTitle());
                return fallbackToKopis(show);
            }
            return members;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return fallbackToKopis(show);
        } catch (Exception e) {
            log.error("PlayDB 크롤링 실패 ({}): {}", show.getTitle(), e.getMessage(), e);
            return fallbackToKopis(show);
        }
    }

    private String searchShow(String title) throws IOException {
        String cleanTitle = title.replaceAll("^(뮤지컬|연극)\\s*", "").trim();

        String searchUrl = PLAYDB_SEARCH_URL
                + "?sReqMainCategory=000001&sReqTextType=0&sReqText="
                + URLEncoder.encode(cleanTitle, StandardCharsets.UTF_8);

        log.info("PlayDB 검색: {} → {}", cleanTitle, searchUrl);

        Document doc = Jsoup.connect(searchUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        // goDetail('221340') 패턴
        Elements allLinks = doc.select("a[href*=goDetail], a[onclick*=goDetail]");
        for (Element link : allLinks) {
            String href = link.attr("href") + link.attr("onclick");
            Matcher matcher = GO_DETAIL_PATTERN.matcher(href);
            if (matcher.find()) {
                log.info("PlayDB 검색 결과: {} → ID {}", cleanTitle, matcher.group(1));
                return matcher.group(1);
            }
        }

        // PlaydbDetail URL 패턴
        Elements detailLinks = doc.select("a[href*=PlaydbDetail], a[href*=playdbDetail]");
        for (Element link : detailLinks) {
            Matcher matcher = PLAY_NO_PATTERN.matcher(link.attr("href"));
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        log.info("PlayDB 검색 결과 없음: {}", cleanTitle);
        return null;
    }

    /**
     * PlayDB 출연진 탭 파싱.
     * 핵심: 페이지 전체가 아니라, "출연진" 텍스트 이후 ~ "제작진" 텍스트 이전 영역만 파싱.
     * 이 영역에서 "~역" 텍스트 다음에 나오는 배우 이름들을 추출.
     */
    private List<CastMember> parseCastTab(String playdbId, Show show) throws IOException {
        String detailUrl = PLAYDB_DETAIL_URL + "?sReqPlayno=" + playdbId + "&sReqTab=3";
        log.info("PlayDB 출연진 탭: {}", detailUrl);

        Document doc = Jsoup.connect(detailUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        List<CastMember> members = new ArrayList<>();

        // 전체 HTML 텍스트를 가져와서 로깅 (디버깅용)
        String bodyHtml = doc.body().html();
        log.debug("PlayDB 페이지 HTML 길이: {}", bodyHtml.length());

        // 전략: body의 모든 텍스트 노드를 순회하며 "~역" 패턴을 찾고,
        // 그 다음에 나오는 a 태그(배우 링크)들을 해당 배역으로 매핑

        // 1. 본문 콘텐츠 영역만 추출 (nav, header, footer, sidebar 제외)
        // PlayDB의 본문은 보통 td 또는 div 안에 들어있음
        // "출연진" 이라는 텍스트가 있는 영역을 찾기
        Element castSection = findCastSection(doc);

        if (castSection == null) {
            log.warn("출연진 섹션을 찾을 수 없음");
            return members;
        }

        log.info("출연진 섹션 발견, HTML 길이: {}", castSection.html().length());

        // 2. 출연진 섹션 내에서 역할-배우 매핑 추출
        String currentRole = "출연";
        List<Node> allNodes = flattenNodes(castSection);

        for (int i = 0; i < allNodes.size(); i++) {
            Node node = allNodes.get(i);

            // 텍스트 노드에서 "~역" 패턴 찾기
            if (node instanceof TextNode) {
                String text = ((TextNode) node).text().trim();
                if (isRoleText(text)) {
                    currentRole = text;
                    log.debug("배역 발견: {}", currentRole);
                }
            }
            // Element에서 "~역" 텍스트 확인
            else if (node instanceof Element) {
                Element el = (Element) node;

                // 네비게이션/메뉴 링크 제외 (인물DB, 뮤지컬배우 등)
                if (isNavigationElement(el)) {
                    continue;
                }

                String ownText = el.ownText().trim();
                if (isRoleText(ownText)) {
                    currentRole = ownText;
                    log.debug("배역 발견 (element): {}", currentRole);
                }

                // a 태그이고 배우 관련 링크인 경우
                if ("a".equals(el.tagName())) {
                    String href = el.attr("href").toLowerCase();
                    // artistdb 또는 ManNo가 포함된 배우 프로필 링크만
                    if ((href.contains("artistdb") || href.contains("manno"))
                            && !isNavigationElement(el)) {

                        String actorName = extractActorName(el);
                        if (!actorName.isEmpty() && !isMenuText(actorName)) {
                            String imageUrl = extractActorImage(el, allNodes, i);

                            // 중복 방지
                            final String role = currentRole;
                            boolean dup = members.stream()
                                    .anyMatch(m -> m.getActorName().equals(actorName) && m.getRoleName().equals(role));

                            if (!dup) {
                                members.add(CastMember.builder()
                                        .show(show)
                                        .roleName(currentRole)
                                        .actorName(actorName)
                                        .actorImageUrl(imageUrl)
                                        .playdbId(playdbId)
                                        .build());
                                log.debug("배우 추가: {} - {} ({})", currentRole, actorName, imageUrl);
                            }
                        }
                    }
                }
            }
        }

        log.info("PlayDB 파싱 완료: {} → {}명", show.getTitle(), members.size());
        return members;
    }

    /**
     * "출연진" 텍스트가 포함된 콘텐츠 섹션을 찾습니다.
     * 네비게이션 바가 아닌 본문 콘텐츠 영역을 반환.
     */
    private Element findCastSection(Document doc) {
        // 1. "출연진" 이라는 텍스트를 포함한 요소 찾기
        Elements castHeaders = doc.getElementsContainingOwnText("출연진");

        for (Element header : castHeaders) {
            // 네비게이션 안에 있는 "출연진/제작진" 탭 텍스트는 건너뛰기
            Element parent = header;
            boolean isNav = false;

            // 부모를 5단계까지 올라가면서 nav, menu, header 여부 체크
            for (int depth = 0; depth < 5 && parent != null; depth++) {
                String className = parent.className().toLowerCase();
                String tagName = parent.tagName().toLowerCase();
                if (tagName.equals("nav") || className.contains("menu") || className.contains("gnb")
                        || className.contains("lnb") || className.contains("header")) {
                    isNav = true;
                    break;
                }
                parent = parent.parent();
            }

            if (!isNav) {
                // 이 요소의 부모 중 충분히 큰 컨테이너를 반환
                Element container = header.parent();
                while (container != null && container.html().length() < 500) {
                    container = container.parent();
                }
                if (container != null) {
                    return container;
                }
            }
        }

        // 2. 폴백: 탭 콘텐츠 영역 (sReqTab=3일 때의 본문)
        // PlayDB는 보통 테이블 기반 레이아웃을 사용
        Elements contentTds = doc.select("td[width], td.cont, div.contents, div.detail_cont");
        for (Element td : contentTds) {
            if (td.html().contains("역") && td.select("a[href*=artistdb]").size() >= 2) {
                return td;
            }
        }

        // 3. 마지막 폴백: body 전체
        return doc.body();
    }

    /**
     * 노드 트리를 깊이 우선으로 평탄화합니다.
     */
    private List<Node> flattenNodes(Element root) {
        List<Node> result = new ArrayList<>();
        flattenHelper(root, result);
        return result;
    }

    private void flattenHelper(Node node, List<Node> result) {
        result.add(node);
        for (Node child : node.childNodes()) {
            flattenHelper(child, result);
        }
    }

    /**
     * "~역" 패턴인지 확인 (배역 텍스트)
     */
    private boolean isRoleText(String text) {
        if (text == null || text.isEmpty())
            return false;
        // "라이토 역", "엘(L) 역", "렘 역" 등
        return (text.endsWith("역") || text.endsWith(" 역"))
                && text.length() >= 2
                && text.length() <= 30
                && !text.contains("연극")
                && !text.contains("뮤지컬");
    }

    /**
     * 네비게이션/메뉴 요소인지 확인
     */
    private boolean isNavigationElement(Element el) {
        String text = el.text().trim();
        String href = el.attr("href").toLowerCase();

        // 메뉴 관련 텍스트
        if (isMenuText(text))
            return true;

        // 카테고리/검색 관련 링크
        if (href.contains("artistdb/list") || href.contains("category") || href.contains("search"))
            return true;

        // 클래스/ID로 판별
        String className = el.className().toLowerCase();
        if (className.contains("menu") || className.contains("nav") || className.contains("gnb"))
            return true;

        return false;
    }

    /**
     * 메뉴 텍스트인지 확인
     */
    private boolean isMenuText(String text) {
        if (text == null)
            return false;
        String[] menuKeywords = {
                "인물DB", "뮤지컬 배우", "연극 배우", "뮤지션", "클래식 뮤지션", "성악가",
                "국악인", "무용인", "예술단체", "제작스태프", "기획스태프", "직종별 전체보기",
                "뮤지컬배우", "연극배우", "클래식뮤지션", "더보기", "뮤지컬배우", "인물DB"
        };
        for (String keyword : menuKeywords) {
            if (text.equals(keyword) || text.trim().equals(keyword))
                return true;
        }
        return false;
    }

    /**
     * a 태그에서 배우 이름 추출
     */
    private String extractActorName(Element link) {
        // 링크 자체 텍스트 (이미지가 아닌 경우)
        String text = link.ownText().trim();
        if (!text.isEmpty() && text.length() <= 20 && !text.contains("http")) {
            return text;
        }

        // 링크 안의 텍스트
        text = link.text().trim();
        if (!text.isEmpty() && text.length() <= 20 && !text.contains("http")) {
            return text;
        }

        // img alt
        Element img = link.selectFirst("img");
        if (img != null) {
            String alt = img.attr("alt").trim();
            if (!alt.isEmpty() && alt.length() <= 20)
                return alt;
        }

        // 바로 다음 형제 a 태그 (이미지a → 이름a 패턴)
        Element next = link.nextElementSibling();
        if (next != null && "a".equals(next.tagName())) {
            String nextText = next.ownText().trim();
            if (!nextText.isEmpty() && nextText.length() <= 20)
                return nextText;
        }

        return "";
    }

    /**
     * 배우 프로필 이미지 URL 추출
     */
    private String extractActorImage(Element link, List<Node> allNodes, int currentIndex) {
        // 링크 내 img
        Element img = link.selectFirst("img");
        if (img != null) {
            return resolveImageUrl(img);
        }

        // 이전 형제 a 태그 안의 img (이미지a → 이름a 패턴)
        Element prev = link.previousElementSibling();
        if (prev != null && "a".equals(prev.tagName())) {
            Element prevImg = prev.selectFirst("img");
            if (prevImg != null) {
                return resolveImageUrl(prevImg);
            }
        }

        return null;
    }

    private String resolveImageUrl(Element img) {
        String src = img.absUrl("src");
        if (!src.isEmpty())
            return src;

        src = img.attr("src");
        if (!src.isEmpty() && !src.startsWith("http")) {
            return "http://www.playdb.co.kr" + (src.startsWith("/") ? "" : "/") + src;
        }
        return src.isEmpty() ? null : src;
    }

    private List<CastMember> fallbackToKopis(Show show) {
        if (show.getCastInfo() == null || show.getCastInfo().isEmpty()) {
            return List.of();
        }
        List<CastMember> members = new ArrayList<>();
        for (String actor : show.getCastInfo().split("[,/]")) {
            String name = actor.trim().replaceAll("\\s+등$", "");
            if (!name.isEmpty() && name.length() <= 20) {
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
