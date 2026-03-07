package com.curtaincall.infra.kopis;

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
import java.util.List;

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
                log.error("KOPIS API 공연 목록 조회 실패 - page: {}, error: {}", page, e.getMessage());
                break;
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
                    .build();
        } catch (Exception e) {
            log.error("KOPIS API 공연 상세 조회 실패 - kopisId: {}, error: {}", kopisId, e.getMessage());
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
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        String urlStr = String.format(
                "%s/boxoffice?service=%s&ststype=week&date=%s&catecode=%s",
                baseUrl, apiKey, dateStr, catecode);
        if (area != null && !area.isBlank()) {
            urlStr += "&area=" + area;
        }

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
            log.error("KOPIS 박스오피스 조회 실패: {}", e.getMessage());
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
                log.error("KOPIS API 극장 목록 조회 실패 - page: {}, error: {}", page, e.getMessage());
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
            log.error("KOPIS 극장 상세 조회 실패 - kopisId: {}, error: {}", theaterKopisId, e.getMessage());
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

    private String getText(Element el, String tagName) {
        NodeList nodes = el.getElementsByTagName(tagName);
        if (nodes.getLength() == 0 || nodes.item(0) == null)
            return null;
        return nodes.item(0).getTextContent();
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
}
