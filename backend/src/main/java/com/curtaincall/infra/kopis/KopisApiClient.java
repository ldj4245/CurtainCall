package com.curtaincall.infra.kopis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KopisApiClient {

    @Value("${kopis.api-key}")
    private String apiKey;

    @Value("${kopis.base-url}")
    private String baseUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int PAGE_SIZE = 100;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Object KOPIS_RATE_LOCK = new Object();
    private static final long MIN_REQUEST_INTERVAL_MS = 250L;
    private static long lastRequestAtMs = 0L;

    public List<KopisShowDto> fetchShows(LocalDate startDate, LocalDate endDate, String genre) {
        List<KopisShowDto> result = new ArrayList<>();
        int page = 1;

        while (true) {
            String urlStr = String.format(
                    "%s/pblprfr?service=%s&stdate=%s&eddate=%s&cpage=%d&rows=%d&shcate=%s",
                    baseUrl, apiKey,
                    startDate.format(DATE_FORMATTER),
                    endDate.format(DATE_FORMATTER),
                    page, PAGE_SIZE, genre);

            try {
                List<KopisShowDto> pageResult = parseShowList(urlStr);
                if (pageResult.isEmpty())
                    break;
                result.addAll(pageResult);
                if (pageResult.size() < PAGE_SIZE)
                    break;
                page++;
                Thread.sleep(300);
            } catch (Exception e) {
                log.error("KOPIS API 공연 목록 조회 실패 - page: {}, error: {}", page, maskKey(e.getMessage()));
                if (e instanceof InterruptedException) Thread.currentThread().interrupt();
                throw new IllegalStateException("공연 목록 갱신에 실패했습니다. 기존 데이터를 유지합니다.", e);
            }
        }

        return result;
    }

    public KopisShowDetailDto fetchShowDetail(String kopisId) {
        String urlStr = String.format("%s/pblprfr/%s?service=%s", baseUrl, kopisId, apiKey);
        try {
            Document doc = fetchXml(urlStr);
            NodeList dbList = doc.getElementsByTagName("db");
            if (dbList.getLength() == 0)
                return null;

            Element el = (Element) dbList.item(0);
            return KopisShowDetailDto.builder()
                    .kopisId(getText(el, "mt20id"))
                    .title(getText(el, "prfnm"))
                    .startDate(getText(el, "prfpdfrom"))
                    .endDate(getText(el, "prfpdto"))
                    .theaterKopisId(getText(el, "mt10id"))
                    .theaterName(getText(el, "fcltynm"))
                    .genre(getText(el, "genrenm"))
                    .posterUrl(getText(el, "poster"))
                    .castInfo(getText(el, "prfcast"))
                    .crew(getText(el, "prfcrew"))
                    .runtime(getText(el, "prfruntime"))
                    .ageLimit(getText(el, "prfage"))
                    .priceInfo(getText(el, "pcseguidance"))
                    .status(getText(el, "prfstate"))
                    .introImages(extractIntroImages(el))
                    .dtguidance(getText(el, "dtguidance"))
                    .area(getText(el, "area"))
                    .bookingLinks(extractBookingLinksJson(el))
                    .build();
        } catch (Exception e) {
            log.error("KOPIS API 공연 상세 조회 실패 - kopisId: {}, error: {}", kopisId, maskKey(e.getMessage()));
            return null;
        }
    }

    /**
     * KOPIS 박스오피스(예매율 기반 인기 순위) 조회
     *
     * @param catecode 장르코드 (GGGA=뮤지컬, AAAA=연극)
     * @param area     지역코드 (11=서울, 빈값=전국)
     * @return kopisId 리스트 (1위부터 순서대로)
     */
    public List<String> fetchBoxOffice(String catecode, String area) {
        // 박스오피스 API 조회 시작일, 종료일 (최근 7일)
        String stdate = LocalDate.now().minusDays(7).format(DATE_FORMATTER);
        String eddate = LocalDate.now().minusDays(1).format(DATE_FORMATTER);

        // KOPIS OpenAPI 박스오피스 요청 파라미터 (stdate: 시작일, eddate: 종료일)
        String urlStr = String.format(
                "%s/boxoffice?service=%s&stdate=%s&eddate=%s&catecode=%s",
                baseUrl, apiKey, stdate, eddate, catecode);

        log.info("KOPIS 박스오피스 API 호출: {}", urlStr.replaceAll("service=[^&]+", "service=***"));

        try {
            Document doc = fetchXml(urlStr);
            NodeList boxofList = doc.getElementsByTagName("boxof");
            List<String> kopisIds = new ArrayList<>();

            for (int i = 0; i < boxofList.getLength(); i++) {
                Element el = (Element) boxofList.item(i);
                String kopisId = getText(el, "mt20id");
                String title = getText(el, "prfnm");
                if (kopisId != null) {
                    kopisIds.add(kopisId);
                    log.info("박스오피스 #{}: {} ({})", i + 1, title, kopisId);
                }
            }
            log.info("KOPIS 박스오피스 조회 완료: {}건 (장르: {})", kopisIds.size(), catecode);
            return kopisIds;
        } catch (Exception e) {
            log.error("KOPIS 박스오피스 조회 실패: {}", maskKey(e.getMessage()));
            return List.of();
        }
    }

    public List<KopisTheaterDto> fetchTheaters() {
        List<KopisTheaterDto> result = new ArrayList<>();
        int page = 1;

        while (true) {
            String urlStr = String.format("%s/prfplc?service=%s&cpage=%d&rows=%d", baseUrl, apiKey, page, PAGE_SIZE);
            try {
                List<KopisTheaterDto> pageResult = parseTheaterList(urlStr);
                if (pageResult.isEmpty())
                    break;
                result.addAll(pageResult);
                if (pageResult.size() < PAGE_SIZE)
                    break;
                page++;
                Thread.sleep(300);
            } catch (Exception e) {
                log.error("KOPIS API 극장 목록 조회 실패 - page: {}, error: {}", page, maskKey(e.getMessage()));
                break;
            }
        }

        return result;
    }

    public KopisTheaterDto fetchTheaterDetail(String theaterKopisId) {
        String urlStr = String.format("%s/prfplc/%s?service=%s", baseUrl, theaterKopisId, apiKey);
        try {
            Document doc = fetchXml(urlStr);
            NodeList dbList = doc.getElementsByTagName("db");
            if (dbList.getLength() == 0)
                return null;

            Element el = (Element) dbList.item(0);
            return KopisTheaterDto.builder()
                    .kopisId(getText(el, "mt10id"))
                    .name(getText(el, "fcltynm"))
                    .region(getText(el, "sidonm"))
                    .address(getText(el, "adres"))
                    .seatScale(parseInteger(getText(el, "seatscale")))
                    .characteristics(getText(el, "fcltychartr"))
                    .build();
        } catch (Exception e) {
            log.error("KOPIS 극장 상세 조회 실패 - kopisId: {}, error: {}", theaterKopisId, maskKey(e.getMessage()));
            return null;
        }
    }

    private List<KopisShowDto> parseShowList(String urlStr) throws Exception {
        Document doc = fetchXml(urlStr);
        NodeList dbList = doc.getElementsByTagName("db");
        List<KopisShowDto> result = new ArrayList<>();

        for (int i = 0; i < dbList.getLength(); i++) {
            Element el = (Element) dbList.item(i);
            result.add(KopisShowDto.builder()
                    .kopisId(getText(el, "mt20id"))
                    .title(getText(el, "prfnm"))
                    .startDate(getText(el, "prfpdfrom"))
                    .endDate(getText(el, "prfpdto"))
                    .theaterName(getText(el, "fcltynm"))
                    .genre(getText(el, "genrenm"))
                    .posterUrl(getText(el, "poster"))
                    .status(getText(el, "prfstate"))
                    .build());
        }
        return result;
    }

    private List<KopisTheaterDto> parseTheaterList(String urlStr) throws Exception {
        Document doc = fetchXml(urlStr);
        NodeList dbList = doc.getElementsByTagName("db");
        List<KopisTheaterDto> result = new ArrayList<>();

        for (int i = 0; i < dbList.getLength(); i++) {
            Element el = (Element) dbList.item(i);
            result.add(KopisTheaterDto.builder()
                    .kopisId(getText(el, "mt10id"))
                    .name(getText(el, "fcltynm"))
                    .region(getText(el, "sidonm"))
                    .address(getText(el, "fcltyaddr"))
                    .seatScale(parseInteger(getText(el, "seatscale")))
                    .characteristics(getText(el, "fcltychartr"))
                    .build());
        }
        return result;
    }

    private Document fetchXml(String urlStr) throws Exception {
        synchronized (KOPIS_RATE_LOCK) {
            long now = System.currentTimeMillis();
            long waitMs = MIN_REQUEST_INTERVAL_MS - (now - lastRequestAtMs);
            if (waitMs > 0) {
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw ie;
                }
            }
            lastRequestAtMs = System.currentTimeMillis();
        }

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(30000);

        try (InputStream is = conn.getInputStream()) {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(is);
        }
    }

    private String maskKey(String message) {
        return message == null ? "" : message.replaceAll("service=[^&\\s]+", "service=***");
    }

    private String getText(Element el, String tagName) {
        NodeList nodes = el.getElementsByTagName(tagName);
        if (nodes.getLength() == 0 || nodes.item(0) == null)
            return null;
        String text = nodes.item(0).getTextContent();
        return (text == null || text.isBlank()) ? null : text.trim();
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank())
            return null;
        try {
            return Integer.parseInt(value.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractIntroImages(Element el) {
        NodeList styurls = el.getElementsByTagName("styurls");
        if (styurls.getLength() == 0)
            return null;
        Element styurlsEl = (Element) styurls.item(0);
        NodeList styurl = styurlsEl.getElementsByTagName("styurl");
        List<String> urls = new ArrayList<>();
        for (int i = 0; i < styurl.getLength(); i++) {
            urls.add(styurl.item(i).getTextContent());
        }
        return String.join(",", urls);
    }

    private String extractBookingLinksJson(Element el) {
        NodeList relates = el.getElementsByTagName("relate");
        Map<String, Map<String, String>> uniqueByUrl = new LinkedHashMap<>();
        for (int i = 0; i < relates.getLength(); i++) {
            Element relateEl = (Element) relates.item(i);
            String rawUrl = getText(relateEl, "relateurl");
            if (rawUrl == null) {
                continue;
            }
            String url = rawUrl.trim();
            String lowerUrl = url.toLowerCase(Locale.ROOT);
            if (!(lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://"))) {
                continue;
            }
            String name = normalizeBookingVendorName(getText(relateEl, "relatenm"));
            uniqueByUrl.putIfAbsent(url, Map.of("name", name, "url", url));
        }
        List<Map<String, String>> items = new ArrayList<>(uniqueByUrl.values());
        items.sort(Comparator.comparingInt(item -> bookingVendorPriority(item.get("name"))));
        try {
            return OBJECT_MAPPER.writeValueAsString(items);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String normalizeBookingVendorName(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            return "공식 예매처";
        }
        String name = rawName.trim();
        String lower = name.toLowerCase(Locale.ROOT);
        if (name.contains("놀유니버스") || name.contains("인터파크") || lower.contains("interpark")) {
            return "NOL 티켓(인터파크)";
        }
        if (name.contains("티켓링크") || lower.contains("ticketlink")) {
            return "티켓링크";
        }
        if (name.contains("예스24") || lower.contains("yes24")) {
            return "YES24 티켓";
        }
        if (name.contains("멜론") || lower.contains("melon")) {
            return "멜론티켓";
        }
        if (name.contains("네이버")) {
            return "네이버 예약";
        }
        if (name.contains("카카오")) {
            return "카카오톡 예약";
        }
        if (name.contains("클립서비스") || lower.contains("clipservice")) {
            return "클립서비스";
        }
        String cleaned = name.replaceAll("(\\s*주식회사|\\s*\\(주\\))$", "").trim();
        return cleaned.isEmpty() ? "공식 예매처" : cleaned;
    }

    private int bookingVendorPriority(String name) {
        if (name == null) return 10;
        return switch (name) {
            case "NOL 티켓(인터파크)" -> 0;
            case "YES24 티켓" -> 1;
            case "멜론티켓" -> 2;
            case "티켓링크" -> 3;
            case "네이버 예약" -> 4;
            case "카카오톡 예약" -> 5;
            default -> 10;
        };
    }
}
