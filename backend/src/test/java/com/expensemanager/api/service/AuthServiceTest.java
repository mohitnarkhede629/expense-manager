package com.expensemanager.api.service;

import com.expensemanager.api.dto.AuthResponse;
import com.expensemanager.api.dto.LoginRequest;
import com.expensemanager.api.dto.RegisterRequest;
import com.expensemanager.api.model.User;
import com.expensemanager.api.repository.UserRepository;
import com.expensemanager.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("John Doe")
                .passwordHash("hashed_password_123")
                .baseCurrency("INR")
                .build();
    }

    @Nested
    @DisplayName("Register Flow Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should successfully register a new user without seeding dummy accounts")
        void shouldRegisterNewUserSuccessfully() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("NewUser@Example.com ");
            request.setFullName(" New User ");
            request.setPassword("SecretPass123");
            request.setBaseCurrency("USD");

            when(userRepository.existsByEmail("NewUser@Example.com ")).thenReturn(false);
            when(passwordEncoder.encode("SecretPass123")).thenReturn("encoded_secret");

            User savedUser = User.builder()
                    .id(2L)
                    .email("newuser@example.com")
                    .fullName("New User")
                    .passwordHash("encoded_secret")
                    .baseCurrency("USD")
                    .build();

            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(2L, "newuser@example.com")).thenReturn("mocked_jwt_token");

            AuthResponse response = authService.register(request);

            // Verify user was saved with cleaned data
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            User capturedUser = userCaptor.getValue();
            assertThat(capturedUser.getEmail()).isEqualTo("newuser@example.com");
            assertThat(capturedUser.getFullName()).isEqualTo("New User");
            assertThat(capturedUser.getBaseCurrency()).isEqualTo("USD");

            // Verify returned response
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("mocked_jwt_token");
            assertThat(response.getId()).isEqualTo(2L);
            assertThat(response.getEmail()).isEqualTo("newuser@example.com");
            assertThat(response.getFullName()).isEqualTo("New User");
            assertThat(response.getBaseCurrency()).isEqualTo("USD");
        }

        @Test
        @DisplayName("Should default base currency to INR if not provided in register")
        void shouldDefaultBaseCurrencyToInr() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("user2@example.com");
            request.setFullName("User Two");
            request.setPassword("password123");
            request.setBaseCurrency(null);

            when(userRepository.existsByEmail("user2@example.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("encoded_pass");

            User savedUser = User.builder()
                    .id(3L)
                    .email("user2@example.com")
                    .fullName("User Two")
                    .passwordHash("encoded_pass")
                    .baseCurrency("INR")
                    .build();

            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(), any())).thenReturn("token");

            authService.register(request);

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getBaseCurrency()).isEqualTo("INR");
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("existing@example.com");
            request.setFullName("Existing User");
            request.setPassword("password123");

            when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("An account with this email already exists");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Login Flow Tests")
    class LoginTests {

        @Test
        @DisplayName("Should successfully authenticate user with valid credentials")
        void shouldLoginSuccessfullyWithValidCredentials() {
            LoginRequest request = new LoginRequest();
            request.setEmail("User@Example.com ");
            request.setPassword("password123");

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches("password123", "hashed_password_123")).thenReturn(true);
            when(jwtService.generateToken(1L, "user@example.com")).thenReturn("valid_jwt_token");

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("valid_jwt_token");
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("user@example.com");
            assertThat(response.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw BadCredentialsException when email is not found")
        void shouldThrowExceptionWhenEmailNotFound() {
            LoginRequest request = new LoginRequest();
            request.setEmail("nonexistent@example.com");
            request.setPassword("password123");

            when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage("Invalid email or password");
        }

        @Test
        @DisplayName("Should throw BadCredentialsException when password does not match")
        void shouldThrowExceptionWhenPasswordDoesNotMatch() {
            LoginRequest request = new LoginRequest();
            request.setEmail("user@example.com");
            request.setPassword("wrong_password");

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches("wrong_password", "hashed_password_123")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class)
                    .hasMessage("Invalid email or password");
        }
    }
}
