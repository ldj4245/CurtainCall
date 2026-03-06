package com.curtaincall.domain.casting.service;

import com.curtaincall.domain.casting.entity.CastMember;
import com.curtaincall.domain.show.entity.Show;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * PlayDB에서 공연 출연진 정보를 크롤링하는 서비스.
 *
 * 크롤링 정책:
 * - robots.txt 없음 (404) → 크롤링 제한 명시 없음
 * - 요청 간 2초 딜레이로 서버 부하 최소화
 * - 비상업적 목적의 데이터 가공 사용
 * - 개인정보 수집하지 않음
 */
@Slf4j
@Service
public class PlaydbCrawlerService {

    private static final String PLAYDB_SEARCH_URL = "http://www.playdb.co.kr/playdb/playdbList.asp";
    private static final String PLAYDB_DETAIL_URL = "http://www.playdb.co.kr/playdb/PlaydbDetail.asp";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    private static final int TIMEOUT_MS = 10000;

    /**
     * PlayDB에서 해당 공연의 출연진 정보를 크롤링합니다.
     */
    public List<CastMember> crawlCasting(Show show) {
        try {
            // 1단계: 공연 제목으로 PlayDB 검색하여 공연 ID 찾기
            String playdbId = searchShow(show.getTitle());
            if (playdbId == null) {
                log.info("PlayDB에서 공연을 찾을 수 없음: {}", show.getTitle());
                return List.of();
            }

            Thread.sleep(2000); // 예의 바른 크롤링 딜레이

            // 2단계: 출연진/제작진 탭에서 캐스팅 정보 파싱
            return parseCastMembers(playdbId, show);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("크롤링 중단됨: {}", show.getTitle());
            return List.of();
        } catch (Exception e) {
            log.error("PlayDB 크롤링 실패 ({}): {}", show.getTitle(), e.getMessage());
            return List.of();
        }
    }

    /**
     * PlayDB에서 공연 제목을 검색하여 첫 번째 결과의 공연 ID를 반환합니다.
     */
    private String searchShow(String title) throws IOException {
        String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
        String searchUrl = PLAYDB_SEARCH_URL + "?sReqMainCategory=000001&sReqSubCategory=&sReqTextType=0&sReqText="
                + encodedTitle;

        Document doc = Jsoup.connect(searchUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        // 검색결과에서 첫 번째 공연 링크 추출
        Elements links = doc.select("a[href*=PlaydbDetail]");
        if (links.isEmpty()) {
            // 다른 셀렉터 시도
            links = doc.select(".list_cont a, .tit a, td a[href*=playno]");
        }

        for (Element link : links) {
            String href = link.attr("href");
            String playNo = extractPlayNo(href);
            if (playNo != null) {
                log.debug("PlayDB 공연 발견: {} → ID: {}", title, playNo);
                return playNo;
            }
        }

        return null;
    }

    /**
     * PlayDB 상세 페이지의 출연진/제작진 탭에서 배역별 배우 정보를 파싱합니다.
     */
    private List<CastMember> parseCastMembers(String playdbId, Show show) throws IOException {
        String detailUrl = PLAYDB_DETAIL_URL + "?sReqPlayno=" + playdbId + "&sReqTab=3";

        Document doc = Jsoup.connect(detailUrl)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .get();

        List<CastMember> members = new ArrayList<>();

        // 출연진 정보 파싱 - PlayDB의 출연진 목록 구조
        Elements castSections = doc.select(".detail_contentslist dl, .cast_list dl, .casting_list dl");

        if (castSections.isEmpty()) {
            // 대체 셀렉터: 테이블 구조
            castSections = doc.select("table.cast_table tr, div.cast_wrap");
        }

        if (castSections.isEmpty()) {
            // 마지막 시도: dt/dd 쌍으로 직접 탐색
            Elements dts = doc.select("dt");
            Elements dds = doc.select("dd");

            for (int i = 0; i < Math.min(dts.size(), dds.size()); i++) {
                String roleName = dts.get(i).text().trim();
                Element dd = dds.get(i);
                Elements actorLinks = dd.select("a");

                if (actorLinks.isEmpty()) {
                    // a 태그가 없으면 텍스트 직접 파싱
                    String actorText = dd.text().trim();
                    if (!actorText.isEmpty() && !roleName.isEmpty()) {
                        for (String name : actorText.split("[,/]")) {
                            String actorName = name.trim();
                            if (!actorName.isEmpty()) {
                                members.add(buildCastMember(show, roleName, actorName, null, playdbId));
                            }
                        }
                    }
                } else {
                    for (Element actorLink : actorLinks) {
                        String actorName = actorLink.text().trim();
                        Element img = actorLink.select("img").first();
                        String imageUrl = img != null ? img.absUrl("src") : null;

                        if (actorName.isEmpty() && img != null) {
                            actorName = img.attr("alt").trim();
                        }

                        if (!actorName.isEmpty()) {
                            members.add(buildCastMember(show, roleName, actorName, imageUrl, playdbId));
                        }
                    }
                }
            }
        } else {
            // dl 구조 파싱
            for (Element dl : castSections) {
                Elements dtsInDl = dl.select("dt");
                Elements ddsInDl = dl.select("dd");

                for (int i = 0; i < Math.min(dtsInDl.size(), ddsInDl.size()); i++) {
                    String roleName = dtsInDl.get(i).text().trim();
                    Element dd = ddsInDl.get(i);

                    Elements actorLinks = dd.select("a");
                    for (Element actorLink : actorLinks) {
                        String actorName = actorLink.text().trim();
                        Element img = actorLink.select("img").first();
                        String imageUrl = img != null ? img.absUrl("src") : null;

                        if (actorName.isEmpty() && img != null) {
                            actorName = img.attr("alt").trim();
                        }

                        if (!actorName.isEmpty() && !actorName.equals("더보기")) {
                            members.add(buildCastMember(show, roleName, actorName, imageUrl, playdbId));
                        }
                    }
                }
            }
        }

        // 만약 크롤링으로 아무것도 못 가져왔으면 기존 castInfo를 활용
        if (members.isEmpty() && show.getCastInfo() != null && !show.getCastInfo().isEmpty()) {
            log.info("PlayDB 파싱 실패, 기존 castInfo 사용: {}", show.getTitle());
            String[] actors = show.getCastInfo().split("[,/]");
            for (String actor : actors) {
                String name = actor.trim();
                if (!name.isEmpty()) {
                    members.add(buildCastMember(show, "출연", name, null, null));
                }
            }
        }

        return members;
    }

    private CastMember buildCastMember(Show show, String roleName, String actorName, String imageUrl, String playdbId) {
        return CastMember.builder()
                .show(show)
                .roleName(roleName)
                .actorName(actorName)
                .actorImageUrl(imageUrl)
                .playdbId(playdbId)
                .build();
    }

    /**
     * URL에서 PlayDB 공연 번호를 추출합니다.
     */
    private String extractPlayNo(String href) {
        if (href == null)
            return null;

        // sReqPlayno= 또는 sReqPlayNo= 파라미터에서 추출
        String lowerHref = href.toLowerCase();
        int idx = lowerHref.indexOf("sreqplayno=");
        if (idx == -1) {
            idx = lowerHref.indexOf("sreqplayno=");
        }
        if (idx >= 0) {
            String sub = href.substring(idx + 11);
            int end = sub.indexOf('&');
            return end > 0 ? sub.substring(0, end) : sub;
        }
        return null;
    }
}
