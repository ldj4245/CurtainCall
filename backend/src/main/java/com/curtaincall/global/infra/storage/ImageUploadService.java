package com.curtaincall.global.infra.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class ImageUploadService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (S3)
    private static final long MAX_EMBEDDED_FILE_SIZE = 2 * 1024 * 1024; // 2MB (Base64 fallback)
    private static final Set<String> HEIC_BRANDS = Set.of(
            "heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"
    );

    private final S3Client s3Client;
    private final String bucket;
    private final String cdnUrl;
    private final boolean s3Configured;

    public ImageUploadService(
            @Value("${storage.do-spaces.endpoint:}") String endpoint,
            @Value("${storage.do-spaces.region:us-east-1}") String region,
            @Value("${storage.do-spaces.access-key:}") String accessKey,
            @Value("${storage.do-spaces.secret-key:}") String secretKey,
            @Value("${storage.do-spaces.bucket:}") String bucket,
            @Value("${storage.do-spaces.cdn-url:}") String cdnUrl) {
        this.bucket = bucket;
        this.cdnUrl = cdnUrl;

        boolean hasCredentials = accessKey != null && !accessKey.isBlank() && !"dummy-access-key".equals(accessKey)
                && secretKey != null && !secretKey.isBlank() && !"dummy-secret-key".equals(secretKey)
                && endpoint != null && !endpoint.isBlank() && bucket != null && !bucket.isBlank();

        if (hasCredentials) {
            S3Client client = null;
            try {
                client = S3Client.builder()
                        .endpointOverride(URI.create(endpoint))
                        .region(Region.of(region != null && !region.isBlank() ? region : "us-east-1"))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)))
                        .build();
                log.info("S3-compatible storage initialized for bucket '{}'", bucket);
            } catch (Exception e) {
                log.warn("Failed to initialize S3Client, falling back to embedded Base64 storage: {}", e.getMessage());
            }
            this.s3Client = client;
            this.s3Configured = (client != null);
        } else {
            this.s3Client = null;
            this.s3Configured = false;
            log.info("No external S3 storage configured. ImageUploadService will use embedded data URI storage (Zero-cost).");
        }
    }

    public String uploadImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 5MB 이하여야 합니다.");
        }
        if (!s3Configured && file.getSize() > MAX_EMBEDDED_FILE_SIZE) {
            throw new IllegalArgumentException("사진 파일은 2MB 이하로 올려 주세요.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 읽기 중 오류가 발생했습니다.", e);
        }

        ImageFormat format = detectImageType(bytes);
        if (format == null) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. (jpeg, png, webp, heic만 가능)");
        }

        if (!s3Configured) {
            String base64 = Base64.getEncoder().encodeToString(bytes);
            return "data:" + format.mimeType() + ";base64," + base64;
        }

        String key = folder + "/" + UUID.randomUUID() + "." + format.extension();
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(format.mimeType())
                .contentLength((long) bytes.length)
                .acl("public-read")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(bytes));
        return cdnUrl + "/" + key;
    }

    public void deleteImage(String imageUrl) {
        if (!s3Configured || imageUrl == null || cdnUrl == null || !imageUrl.startsWith(cdnUrl)) {
            return;
        }
        String key = imageUrl.substring(cdnUrl.length() + 1);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("이미지 삭제 실패: {}", imageUrl, e);
        }
    }

    public void deleteOwnedDiaryImage(String imageUrl, Long userId) {
        if (cdnUrl == null || imageUrl == null || !imageUrl.startsWith(cdnUrl + "/diary/" + userId + "/")) return;
        deleteImage(imageUrl);
    }

    static ImageFormat detectImageType(byte[] bytes) {
        if (bytes == null) {
            return null;
        }
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return new ImageFormat("image/jpeg", "jpg");
        }
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return new ImageFormat("image/png", "png");
        }
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return new ImageFormat("image/webp", "webp");
        }
        if (bytes.length >= 12 && bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p') {
            String brand = new String(bytes, 8, 4, StandardCharsets.US_ASCII);
            if (HEIC_BRANDS.contains(brand)) {
                return new ImageFormat("image/heic", "heic");
            }
        }
        return null;
    }

    record ImageFormat(String mimeType, String extension) {}
}
