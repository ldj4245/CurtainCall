package com.curtaincall.infra.oauth2;

import com.curtaincall.domain.user.entity.SocialAccount;
import com.curtaincall.domain.user.entity.User;
import com.curtaincall.domain.user.repository.SocialAccountRepository;
import com.curtaincall.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        OAuth2UserInfo userInfo = OAuth2UserInfo.of(registrationId, attributes);

        User user = saveOrUpdate(userInfo);

        return new CustomOAuth2User(user.getId(), user.getEmail(), attributes, userNameAttributeName);
    }

    private User saveOrUpdate(OAuth2UserInfo userInfo) {
        return socialAccountRepository.findByProviderAndProviderId(userInfo.getProvider(), userInfo.getId())
                .map(socialAccount -> {
                    User user = socialAccount.getUser();
                    user.updateProfile(
                            userInfo.getName() != null ? userInfo.getName() : user.getNickname(),
                            userInfo.getImageUrl()
                    );
                    return user;
                })
                .orElseGet(() -> {
                    User newUser = userRepository.save(User.builder()
                            .nickname(userInfo.getName() != null ? userInfo.getName() : "회원")
                            .email(userInfo.getEmail())
                            .profileImage(userInfo.getImageUrl())
                            .build());

                    socialAccountRepository.save(SocialAccount.builder()
                            .user(newUser)
                            .provider(userInfo.getProvider())
                            .providerId(userInfo.getId())
                            .build());

                    return newUser;
                });
    }
}
