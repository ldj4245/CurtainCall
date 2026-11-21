package com.curtaincall.global.config;

import com.curtaincall.domain.show.repository.ShowRepository;
import com.curtaincall.domain.diary.repository.DiaryEntryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Controller @RequiredArgsConstructor @Transactional(readOnly = true)
public class PublicPageController {
    private final ShowRepository shows;
    private final DiaryEntryRepository diaries;
    private final ObjectMapper json;
    @Value("${app.frontend-url}") private String baseUrl;

    @GetMapping(value = "/shows/{id:[0-9]+}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody public ResponseEntity<String> show(@PathVariable Long id) throws Exception {
        var s = shows.findById(id).orElse(null);
        if (s == null) return page("공연을 찾을 수 없습니다.", "공연 정보가 없습니다.", null, "/shows/" + id, true, null, 404);
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("@context", "https://schema.org"); event.put("@type", "Event"); event.put("name", s.getTitle());
        event.put("url", baseUrl + "/shows/" + id);
        if (s.getStartDate() != null) event.put("startDate", s.getStartDate().toString());
        if (s.getEndDate() != null) event.put("endDate", s.getEndDate().toString());
        if (s.getPosterUrl() != null) event.put("image", s.getPosterUrl());
        if (s.getTheater() != null) event.put("location", Map.of("@type", "Place", "name", s.getTheater().getName(), "address", Objects.toString(s.getTheater().getAddress(), "")));
        return page(s.getTitle() + " | 커튼콜", s.getTitle() + " 공연 정보 · " + Objects.toString(s.getStartDate(), "") + " ~ " + Objects.toString(s.getEndDate(), ""), s.getPosterUrl(), "/shows/" + id, false, event, 200);
    }
    @GetMapping(value = "/shared/{token}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody public ResponseEntity<String> shared(@PathVariable String token) throws Exception {
        var d = diaries.findByShareTokenAndIsOpenTrue(token).orElse(null);
        if (d == null) return page("공개된 기록이 없습니다. | 커튼콜", "비공개로 바뀌거나 삭제된 기록입니다.", null, "/shared/" + token, true, null, 404);
        // Preview metadata never includes review text, user photos, prices, seats or spoilers.
        return page(d.getShow().getTitle() + " 관람 기록 | 커튼콜", d.getWatchedDate() + " 관람 기록", d.getShow().getPosterUrl(), "/shared/" + token, true, null, 200);
    }
    private ResponseEntity<String> page(String title, String description, String image, String path, boolean noindex, Object data, int status) throws Exception {
        String html;
        try (var in = new ClassPathResource("static/index.html").getInputStream()) { html = new String(in.readAllBytes(), StandardCharsets.UTF_8); }
        var doc = Jsoup.parse(html);
        doc.title(title);
        doc.select("meta[property^=og:],meta[name^=twitter:],meta[name=description],link[rel=canonical],meta[name=robots],script[type=application/ld+json]").remove();
        for (var entry : Map.of("og:title", title, "og:description", description, "og:url", baseUrl + path, "og:type", "website", "og:site_name", "커튼콜").entrySet())
            doc.head().appendElement("meta").attr("property", entry.getKey()).attr("content", entry.getValue());
        if (image != null && image.startsWith("http")) doc.head().appendElement("meta").attr("property", "og:image").attr("content", image);
        doc.head().appendElement("meta").attr("name", "description").attr("content", description);
        doc.head().appendElement("meta").attr("name", "twitter:card").attr("content", "summary_large_image");
        doc.head().appendElement("link").attr("rel", "canonical").attr("href", baseUrl + path);
        doc.head().appendElement("meta").attr("name", "robots").attr("content", noindex ? "noindex, noarchive" : "index, follow");
        if (data != null) doc.head().appendElement("script").attr("type", "application/ld+json").appendChild(new org.jsoup.nodes.DataNode(json.writeValueAsString(data).replace("<", "\\u003c")));
        doc.body().appendElement("noscript").text(title + " — " + description);
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).contentType(new MediaType("text", "html", StandardCharsets.UTF_8)).body(doc.outerHtml());
    }
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    @ResponseBody public String robots() {
        if (baseUrl.contains("localhost") || baseUrl.contains("127.0.0.1")) return "User-agent: *\nDisallow: /\n";
        return "User-agent: *\nDisallow: /api/\nDisallow: /shared/\nDisallow: /diary\nDisallow: /my\nDisallow: /plans\nDisallow: /notifications\nDisallow: /login\nDisallow: /signup\nSitemap: " + baseUrl + "/sitemap.xml\n";
    }
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @ResponseBody public String sitemap() {
        var xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        String safeBase = org.springframework.web.util.HtmlUtils.htmlEscape(baseUrl);
        xml.append("<url><loc>").append(safeBase).append("/</loc></url>");
        for (Long id : shows.findAllIds(org.springframework.data.domain.PageRequest.of(0, 49999))) xml.append("<url><loc>").append(safeBase).append("/shows/").append(id).append("</loc></url>");
        return xml.append("</urlset>").toString();
    }
}
