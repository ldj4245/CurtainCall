package com.curtaincall.domain.diary.service;

import com.curtaincall.global.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OpenAiTicketDraftExtractor implements TicketDraftExtractor {

    private static final String SYSTEM_PROMPT = """
            너는 한국 공연 예매 확인 화면과 모바일 티켓 이미지를 읽어 관극 기록 초안을 만드는 도우미다.
            오직 JSON만 반환하고, 알 수 없는 값은 null로 둔다.
            watchedDate는 YYYY-MM-DD 형식, performanceTime은 HH:mm 형식으로 반환한다.
            ticketPrice는 숫자만 반환한다.
            confidence는 0부터 1 사이 숫자로 반환한다.
            warnings는 문자열 배열로 반환한다.
            JSON 키는 정확히 아래만 사용한다.
            showTitle, theaterName, watchedDate, performanceTime, seatInfo, ticketPrice, confidence, warnings
            """;

    private static final String USER_PROMPT = """
            업로드된 이미지에서 공연 예매 정보나 모바일 티켓 내용을 읽어서 관극 기록 초안을 추출해 주세요.
            가장 가능성이 높은 공연명, 극장명, 관람일, 회차 시간, 좌석 정보, 결제 금액을 찾고,
            헷갈리는 부분이나 누락된 값은 warnings 배열에 짧게 남겨 주세요.
            """;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${openai.model:gpt-4.1-mini}")
    private String model;

    @Override
    public TicketDraftExtractionResult extract(MultipartFile file) {
        if (apiKey == null || apiKey.isBlank()) {
            throw BusinessException.serviceUnavailable("티켓 자동 초안 설정이 아직 준비되지 않았습니다.");
        }

        try {
            String payload = buildRequestBody(file);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw BusinessException.serviceUnavailable("티켓 이미지를 읽는 중 오류가 발생했습니다.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                throw BusinessException.serviceUnavailable("티켓 이미지를 읽는 결과가 비어 있습니다.");
            }

            JsonNode extracted = objectMapper.readTree(stripCodeFence(content));
            return TicketDraftExtractionResult.builder()
                    .showTitle(nullableText(extracted.get("showTitle")))
                    .theaterName(nullableText(extracted.get("theaterName")))
                    .watchedDate(parseDate(nullableText(extracted.get("watchedDate"))))
                    .performanceTime(parseTime(nullableText(extracted.get("performanceTime"))))
                    .seatInfo(nullableText(extracted.get("seatInfo")))
                    .ticketPrice(parseInteger(extracted.get("ticketPrice")))
                    .confidence(extracted.path("confidence").asDouble(0.0))
                    .warnings(parseWarnings(extracted.get("warnings")))
                    .build();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw BusinessException.serviceUnavailable("티켓 이미지를 읽는 중 오류가 발생했습니다.");
        }
    }

    private String buildRequestBody(MultipartFile file) throws IOException {
        String contentType = file.getContentType() == null ? MediaType.IMAGE_PNG_VALUE : file.getContentType();
        String dataUrl = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());

        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", model);
        root.put("temperature", 0.1);
        root.set("response_format", objectMapper.createObjectNode().put("type", "json_object"));

        ArrayNode messages = root.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content", SYSTEM_PROMPT);

        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        ArrayNode content = userMessage.putArray("content");
        content.addObject()
                .put("type", "text")
                .put("text", USER_PROMPT);
        ObjectNode imagePart = content.addObject();
        imagePart.put("type", "image_url");
        imagePart.putObject("image_url").put("url", dataUrl);

        return objectMapper.writeValueAsString(root);
    }

    private String nullableText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        String value = node.asText().trim();
        return value.isEmpty() || "null".equalsIgnoreCase(value) ? null : value;
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalTime parseTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(raw);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer parseInteger(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isInt() || node.isLong()) {
            return node.asInt();
        }
        String raw = node.asText("").replaceAll("[^0-9]", "");
        if (raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<String> parseWarnings(JsonNode node) {
        if (node == null || node.isNull() || !node.isArray()) {
            return List.of();
        }
        return objectMapper.convertValue(node, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
    }

    private String stripCodeFence(String content) {
        String trimmed = content.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }

        String withoutStart = trimmed.replaceFirst("^```(?:json)?\\s*", "");
        return withoutStart.replaceFirst("\\s*```$", "").trim();
    }
}
