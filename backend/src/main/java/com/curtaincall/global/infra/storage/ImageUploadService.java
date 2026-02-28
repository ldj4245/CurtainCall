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

    public ImageUploadService(
            @Value("${storage.do-spaces.endpoint}") String endpoint,
            @Value("${storage.do-spaces.region}") String region,
            @Value("${storage.do-spaces.access-key}") String accessKey,
            @Value("${storage.do-spaces.secret-key}") String secretKey,
            @Value("${storage.do-spaces.bucket}") String bucket,
            @Value("${storage.do-spaces.cdn-url}") String cdnUrl) {
        this.bucket = bucket;
        this.cdnUrl = cdnUrl;
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    public String uploadImage(MultipartFile file, String folder) {
        validateFile(file);

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
        if (imageUrl == null || !imageUrl.startsWith(cdnUrl)) {
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
