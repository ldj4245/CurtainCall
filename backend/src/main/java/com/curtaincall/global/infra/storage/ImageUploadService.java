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
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ImageUploadService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/heic"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final S3Client s3Client;
    private final String bucket;
    private final String cdnUrl;
    private final boolean s3Configured;

    public ImageUploadService(
            @Value("${storage.do-spaces.endpoint:}") String endpoint,
            @Value("${storage.do-spaces.region:sgp1}") String region,
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
        validateFile(file);

        if (!s3Configured) {
            try {
                byte[] bytes = file.getBytes();
                String base64 = Base64.getEncoder().encodeToString(bytes);
                String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                return "data:" + mimeType + ";base64," + base64;
            } catch (IOException e) {
                throw new RuntimeException("이미지 인코딩 중 오류가 발생했습니다.", e);
            }
        }

        String extension = getExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .acl("public-read")
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return cdnUrl + "/" + key;
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드 중 오류가 발생했습니다.", e);
        }
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

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. (jpeg, png, webp, heic만 가능)");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
