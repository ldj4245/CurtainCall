package com.curtaincall.infra.oauth2;

import com.curtaincall.domain.user.entity.SocialAccount;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.SocialAccountRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SocialAccountRepository socialAccountRepository;

    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    @Test
    void preservesCustomNicknameAndProfileImageOnRelogin() {
        User existingUser = User.builder()
                .id(1L)
                .nickname("내커스텀닉네임")
                .email("user@example.test")
                .profileImage("https://cdn.example.test/custom.png")
                .build();
        SocialAccount linked = SocialAccount.builder()
                .user(existingUser)
                .provider(SocialAccount.Provider.KAKAO)
                .providerId("kakao-123")
                .build();

        when(socialAccountRepository.findByProviderAndProviderId(SocialAccount.Provider.KAKAO, "kakao-123"))
                .thenReturn(Optional.of(linked));

        OAuth2UserInfo incoming = stubUserInfo("kakao-123", "카카오원래이름", "https://kakao.example.test/default.png");
        User result = customOAuth2UserService.saveOrUpdate(incoming);

        assertThat(result.getNickname()).isEqualTo("내커스텀닉네임");
        assertThat(result.getProfileImage()).isEqualTo("https://cdn.example.test/custom.png");
    }

    @Test
    void fillsBlankProfileFieldsOnRelogin() {
        User existingUser = User.builder()
                .id(2L)
                .nickname("회원")
                .email("user2@example.test")
                .profileImage(null)
                .build();
        SocialAccount linked = SocialAccount.builder()
                .user(existingUser)
                .provider(SocialAccount.Provider.KAKAO)
                .providerId("kakao-456")
                .build();

        when(socialAccountRepository.findByProviderAndProviderId(SocialAccount.Provider.KAKAO, "kakao-456"))
                .thenReturn(Optional.of(linked));

        OAuth2UserInfo incoming = stubUserInfo("kakao-456", "새닉네임", "https://kakao.example.test/avatar.png");
        User result = customOAuth2UserService.saveOrUpdate(incoming);

        assertThat(result.getNickname()).isEqualTo("새닉네임");
        assertThat(result.getProfileImage()).isEqualTo("https://kakao.example.test/avatar.png");
    }

    private static OAuth2UserInfo stubUserInfo(String id, String name, String imageUrl) {
        return new OAuth2UserInfo(Map.of()) {
            @Override public String getId() { return id; }
            @Override public String getName() { return name; }
            @Override public String getEmail() { return "user@example.test"; }
            @Override public String getImageUrl() { return imageUrl; }
            @Override public SocialAccount.Provider getProvider() { return SocialAccount.Provider.KAKAO; }
        };
    }
}
