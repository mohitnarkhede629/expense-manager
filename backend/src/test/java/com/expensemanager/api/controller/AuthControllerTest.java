package com.expensemanager.api.controller;

import com.expensemanager.api.dto.AuthResponse;
import com.expensemanager.api.dto.LoginRequest;
import com.expensemanager.api.dto.RegisterRequest;
import com.expensemanager.api.model.User;
import com.expensemanager.api.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register - 200 OK on valid registration")
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Alice Bob");
        request.setEmail("alice@example.com");
        request.setPassword("password123");
        request.setBaseCurrency("INR");

        AuthResponse authResponse = AuthResponse.builder()
                .token("jwt-token-xyz")
                .id(1L)
                .email("alice@example.com")
                .fullName("Alice Bob")
                .baseCurrency("INR")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-xyz"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.fullName").value("Alice Bob"))
                .andExpect(jsonPath("$.baseCurrency").value("INR"));
    }

    @Test
    @DisplayName("POST /api/auth/register - 400 Bad Request on duplicate email")
    void shouldReturn400WhenEmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Alice Bob");
        request.setEmail("duplicate@example.com");
        request.setPassword("password123");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("An account with this email already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    @DisplayName("POST /api/auth/register - 400 Bad Request when validation fails")
    void shouldReturn400WhenValidationFails() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName(""); // invalid: blank
        request.setEmail("not-an-email"); // invalid: format
        request.setPassword("123"); // invalid: < 6 chars

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login - 200 OK on successful login")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("password123");

        AuthResponse authResponse = AuthResponse.builder()
                .token("jwt-token-xyz")
                .id(1L)
                .email("alice@example.com")
                .fullName("Alice Bob")
                .baseCurrency("INR")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token-xyz"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login - 401 Unauthorized on invalid credentials")
    void shouldReturn401OnInvalidLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("wrong-password");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("GET /api/auth/me - 200 OK when user is authenticated")
    void shouldReturnCurrentUserWhenAuthenticated() throws Exception {
        User user = User.builder()
                .id(1L)
                .email("alice@example.com")
                .fullName("Alice Bob")
                .baseCurrency("INR")
                .build();

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.email").value("alice@example.com"))
                    .andExpect(jsonPath("$.fullName").value("Alice Bob"))
                    .andExpect(jsonPath("$.baseCurrency").value("INR"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("GET /api/auth/me - 401 Unauthorized when unauthenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Not authenticated"));
    }
}
