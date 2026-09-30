package com.expensemanager.api.controller;

import com.expensemanager.api.model.Account;
import com.expensemanager.api.model.AccountType;
import com.expensemanager.api.model.User;
import com.expensemanager.api.repository.AccountRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountController accountController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User testUser;
    private Account bankAccount;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(accountController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        testUser = User.builder()
                .id(5L)
                .email("test@domain.com")
                .fullName("Test User")
                .build();

        bankAccount = Account.builder()
                .id(101L)
                .name("Savings Account")
                .accountType(AccountType.SAVINGS)
                .currency("INR")
                .currentBalance(new BigDecimal("15000.00"))
                .institutionName("Axis Bank")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/accounts - returns accounts for authenticated user")
    void shouldReturnAccountsForAuthenticatedUser() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            when(accountRepository.findByUserIdAndIsActiveTrue(5L)).thenReturn(List.of(bankAccount));

            mockMvc.perform(get("/api/accounts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(101))
                    .andExpect(jsonPath("$[0].name").value("Savings Account"))
                    .andExpect(jsonPath("$[0].accountType").value("SAVINGS"))
                    .andExpect(jsonPath("$[0].currentBalance").value(15000.00));

            verify(accountRepository).findByUserIdAndIsActiveTrue(5L);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("GET /api/accounts - returns 401 Unauthorized when unauthenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not authenticated"));
    }

    @Test
    @DisplayName("POST /api/accounts - creates account with authenticated user")
    void shouldCreateAccountWithAuthenticatedUser() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            Account newAccount = Account.builder()
                    .name("Credit Card")
                    .accountType(AccountType.CREDIT_CARD)
                    .currency("INR")
                    .currentBalance(BigDecimal.ZERO)
                    .creditLimit(new BigDecimal("50000.00"))
                    .build();

            when(accountRepository.save(any(Account.class))).thenAnswer(i -> {
                Account a = i.getArgument(0);
                a.setId(102L);
                return a;
            });

            mockMvc.perform(post("/api/accounts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(newAccount)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(102))
                    .andExpect(jsonPath("$.name").value("Credit Card"))
                    .andExpect(jsonPath("$.accountType").value("CREDIT_CARD"));

            ArgumentCaptor<Account> captor = ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(captor.capture());
            assertThat(captor.getValue().getUser()).isEqualTo(testUser);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("POST /api/accounts/batch - creates multiple accounts in batch with authenticated user")
    void shouldCreateMultipleAccountsInBatch() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            Account acct1 = Account.builder()
                    .name("HDFC Salary Account")
                    .accountType(AccountType.SAVINGS)
                    .currentBalance(new BigDecimal("25000.00"))
                    .institutionName("HDFC")
                    .build();

            Account acct2 = Account.builder()
                    .name("Amazon ICICI Card")
                    .accountType(AccountType.CREDIT_CARD)
                    .creditLimit(new BigDecimal("100000.00"))
                    .currentBalance(new BigDecimal("4500.00"))
                    .build();

            when(accountRepository.saveAll(any())).thenAnswer(i -> {
                List<Account> list = i.getArgument(0);
                long idGen = 201L;
                for (Account a : list) {
                    a.setId(idGen++);
                }
                return list;
            });

            mockMvc.perform(post("/api/accounts/batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(List.of(acct1, acct2))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].name").value("HDFC Salary Account"))
                    .andExpect(jsonPath("$[0].currency").value("INR"))
                    .andExpect(jsonPath("$[0].isActive").value(true))
                    .andExpect(jsonPath("$[1].name").value("Amazon ICICI Card"))
                    .andExpect(jsonPath("$[1].creditLimit").value(100000.00));

            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<Account>> captor = ArgumentCaptor.forClass(List.class);
            verify(accountRepository).saveAll(captor.capture());
            List<Account> savedList = captor.getValue();
            assertThat(savedList).hasSize(2);
            assertThat(savedList.get(0).getUser()).isEqualTo(testUser);
            assertThat(savedList.get(1).getUser()).isEqualTo(testUser);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("POST /api/accounts/batch - returns 400 when accounts list is empty")
    void shouldReturnBadRequestWhenBatchListIsEmpty() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            mockMvc.perform(post("/api/accounts/batch")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(List.of())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Accounts list cannot be empty"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
