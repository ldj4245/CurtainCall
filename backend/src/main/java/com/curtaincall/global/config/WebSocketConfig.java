package com.curtaincall.global.config;

import com.curtaincall.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final com.curtaincall.domain.chat.repository.ChatRoomRepository rooms;
    private final com.curtaincall.domain.companion.repository.CompanionParticipantRepository participants;
    private final com.curtaincall.domain.showlive.repository.ShowLiveRoomRepository liveRooms;
    private final com.curtaincall.domain.safety.UserBlockRepository blocks;
    private final com.curtaincall.domain.user.repository.UserRepository users;
    private final java.util.Map<String, Long> sessions = new java.util.concurrent.ConcurrentHashMap<>();
    private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/sub");
        registry.setApplicationDestinationPrefixes("/pub");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(frontendUrl)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                        if (jwtTokenProvider.validateToken(token) && jwtTokenProvider.isAccessToken(token) && users.existsByIdAndDeactivatedFalse(jwtTokenProvider.getUserId(token))) {
                            Long userId = jwtTokenProvider.getUserId(token);
                            String role = jwtTokenProvider.getRole(token);
                            var auth = new UsernamePasswordAuthenticationToken(
                                    userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                            accessor.setUser(auth);
                            if (accessor.getSessionId() != null) sessions.put(accessor.getSessionId(), userId);
                        }
                    }
                    if (accessor.getUser() == null) throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
                }
                if (accessor != null && (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) || StompCommand.SEND.equals(accessor.getCommand()))) {
                    if (accessor.getUser() == null) throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
                    checkDestination(accessor.getDestination(), Long.valueOf(accessor.getUser().getName()), StompCommand.SEND.equals(accessor.getCommand()) ? "/pub/" : "/sub/");
                }
                if (accessor != null && StompCommand.DISCONNECT.equals(accessor.getCommand()) && accessor.getSessionId() != null) sessions.remove(accessor.getSessionId());
                return message;
            }
        });
    }

    private void checkDestination(String destination, Long user, String prefix) {
        if (!users.existsByIdAndDeactivatedFalse(user)) throw new org.springframework.security.access.AccessDeniedException("사용할 수 없는 계정입니다.");
        if (destination == null || !destination.matches(java.util.regex.Pattern.quote(prefix) + "(chat|live)/[0-9]+"))
            throw new org.springframework.security.access.AccessDeniedException("허용되지 않은 채팅 경로입니다.");
        Long id = Long.valueOf(destination.substring(destination.lastIndexOf('/') + 1));
        if (destination.startsWith(prefix + "chat/")) {
            var room = rooms.findById(id).orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("채팅방이 없습니다."));
            if (!participants.existsByCompanionPostIdAndUserId(room.getCompanionPost().getId(), user))
                throw new org.springframework.security.access.AccessDeniedException("채팅방 참여자만 접근할 수 있습니다.");
        } else if (!liveRooms.existsById(id)) throw new org.springframework.security.access.AccessDeniedException("채팅방이 없습니다.");
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var a = StompHeaderAccessor.wrap(message);
                if (a.getMessageType() != org.springframework.messaging.simp.SimpMessageType.MESSAGE) return message;
                Long user = a.getSessionId() == null ? null : sessions.get(a.getSessionId());
                if (user == null) return null;
                try {
                    checkDestination(a.getDestination(), user, "/sub/");
                    if (message.getPayload() instanceof byte[] bytes) {
                        var sender = json.readTree(bytes).get("senderId");
                        if (sender != null && blocks.existsByUserIdAndBlockedUserId(user, sender.asLong())) return null;
                    }
                    return message;
                } catch (Exception denied) { return null; }
            }
        });
    }
}
