package com.expensemanager.api.controller;

import com.expensemanager.api.dto.CreateTransactionRequest;
import com.expensemanager.api.model.Transaction;
import com.expensemanager.api.model.TransactionStatus;
import com.expensemanager.api.model.TransactionType;
import com.expensemanager.api.model.User;
import com.expensemanager.api.service.TransactionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController transactionController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User testUser;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(transactionController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        testUser = User.builder()
                .id(8L)
                .email("txuser@example.com")
                .fullName("Tx User")
                .build();

        testTransaction = Transaction.builder()
                .id(501L)
                .user(testUser)
                .transactionType(TransactionType.EXPENSE)
                .amount(new BigDecimal("150.00"))
                .transactionDate(LocalDateTime.now())
                .description("Coffee & snacks")
                .payeeMerchant("Starbucks")
                .status(TransactionStatus.CLEARED)
                .build();
    }

    @Test
    @DisplayName("GET /api/transactions - returns transactions for authenticated user")
    void shouldReturnTransactionsForAuthenticatedUser() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            when(transactionService.getUserTransactions(8L)).thenReturn(List.of(testTransaction));

            mockMvc.perform(get("/api/transactions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].id").value(501))
                    .andExpect(jsonPath("$[0].transactionType").value("EXPENSE"))
                    .andExpect(jsonPath("$[0].amount").value(150.00))
                    .andExpect(jsonPath("$[0].description").value("Coffee & snacks"))
                    .andExpect(jsonPath("$[0].payeeMerchant").value("Starbucks"));

            verify(transactionService).getUserTransactions(8L);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("GET /api/transactions - returns 401 Unauthorized when unauthenticated")
    void shouldReturn401WhenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/transactions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not authenticated"));
    }

    @Test
    @DisplayName("POST /api/transactions - 200 OK on valid transaction request")
    void shouldRecordTransactionSuccessfully() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            CreateTransactionRequest request = new CreateTransactionRequest();
            request.setTransactionType(TransactionType.EXPENSE);
            request.setAmount(new BigDecimal("150.00"));
            request.setSourceAccountId(10L);
            request.setCategoryId(20L);
            request.setDescription("Coffee & snacks");
            request.setPayeeMerchant("Starbucks");

            when(transactionService.recordTransaction(
                    eq(testUser),
                    eq(TransactionType.EXPENSE),
                    eq(new BigDecimal("150.00")),
                    any(),
                    eq(10L),
                    eq(null),
                    eq(20L),
                    eq("Coffee & snacks"),
                    eq("Starbucks")
            )).thenReturn(testTransaction);

            mockMvc.perform(post("/api/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(501))
                    .andExpect(jsonPath("$.amount").value(150.00))
                    .andExpect(jsonPath("$.transactionType").value("EXPENSE"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("POST /api/transactions - parses ISO string with Z or without timezone")
    void shouldAcceptIsoDateTime() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(testUser, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            when(transactionService.recordTransaction(
                    eq(testUser),
                    eq(TransactionType.EXPENSE),
                    eq(new BigDecimal("150.00")),
                    any(),
                    eq(10L),
                    eq(null),
                    eq(20L),
                    eq("Coffee"),
                    eq("Starbucks")
            )).thenReturn(testTransaction);

            String jsonPayload = """
                {
                    "transactionType": "EXPENSE",
                    "amount": 150.00,
                    "transactionDate": "2026-10-01T10:00:00.000Z",
                    "sourceAccountId": 10,
                    "categoryId": 20,
                    "description": "Coffee",
                    "payeeMerchant": "Starbucks"
                }
                """;

            mockMvc.perform(post("/api/transactions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonPayload))
                    .andExpect(status().isOk());
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    @DisplayName("POST /api/transactions - 400 Bad Request when amount is missing")
    void shouldReturn400WhenAmountMissing() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setTransactionType(TransactionType.EXPENSE);
        request.setAmount(null); // invalid

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/transactions - 400 Bad Request when transaction type is missing")
    void shouldReturn400WhenTransactionTypeMissing() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setTransactionType(null); // invalid
        request.setAmount(new BigDecimal("50.00"));

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/transactions - 400 Bad Request when amount is zero or negative")
    void shouldReturn400WhenAmountIsZeroOrNegative() throws Exception {
        CreateTransactionRequest request = new CreateTransactionRequest();
        request.setTransactionType(TransactionType.EXPENSE);
        request.setAmount(BigDecimal.ZERO); // invalid: min is 0.01

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
