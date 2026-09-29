package com.expensemanager.api.integration;

import com.expensemanager.api.dto.AuthResponse;
import com.expensemanager.api.dto.CreateTransactionRequest;
import com.expensemanager.api.dto.LoginRequest;
import com.expensemanager.api.dto.RegisterRequest;
import com.expensemanager.api.model.Account;
import com.expensemanager.api.model.AccountType;
import com.expensemanager.api.model.Category;
import com.expensemanager.api.model.TransactionType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExpenseManagerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("End-to-End Flow: Register, Login, Seed Accounts, Add Card, Transact (Income, ATM, Cash Expense, Card Expense, Bill Pay), Verify Balances")
    void shouldExecuteFullFinancialLifecycleFlow() throws Exception {
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String email = "financier_" + uniqueId + "@example.com";
        String password = "SecurePassword123!";

        // 1. REGISTER
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFullName("Warren Buffett");
        registerRequest.setEmail(email);
        registerRequest.setPassword(password);
        registerRequest.setBaseCurrency("INR");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value(email))
                .andReturn();

        AuthResponse regAuth = objectMapper.readValue(regResult.getResponse().getContentAsString(), AuthResponse.class);
        String token = regAuth.getToken();
        assertThat(token).isNotBlank();

        // 2. LOGIN
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        AuthResponse loginAuth = objectMapper.readValue(loginResult.getResponse().getContentAsString(), AuthResponse.class);
        String authToken = "Bearer " + loginAuth.getToken();

        // 3. GET /api/auth/me
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Warren Buffett"));

        // 4. GET /api/accounts - verify auto-seeded Primary Savings and Physical Cash Wallet
        MvcResult accountsResult = mockMvc.perform(get("/api/accounts")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        List<Account> accounts = objectMapper.readValue(
                accountsResult.getResponse().getContentAsString(),
                new TypeReference<List<Account>>() {}
        );
        assertThat(accounts).hasSize(2);

        Account savingsAccount = accounts.stream()
                .filter(a -> a.getAccountType() == AccountType.SAVINGS)
                .findFirst().orElseThrow();
        Account cashWallet = accounts.stream()
                .filter(a -> a.getAccountType() == AccountType.CASH)
                .findFirst().orElseThrow();

        assertThat(savingsAccount.getCurrentBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(cashWallet.getCurrentBalance()).isEqualByComparingTo(BigDecimal.ZERO);

        // 5. POST /api/accounts - Add a Credit Card Account
        Account cardToCreate = Account.builder()
                .name("HDFC Regalia Credit Card")
                .accountType(AccountType.CREDIT_CARD)
                .currency("INR")
                .currentBalance(BigDecimal.ZERO)
                .creditLimit(new BigDecimal("200000.00"))
                .billingCycleDay(15)
                .paymentDueDay(5)
                .isActive(true)
                .build();

        MvcResult cardResult = mockMvc.perform(post("/api/accounts")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cardToCreate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountType").value("CREDIT_CARD"))
                .andReturn();

        Account creditCard = objectMapper.readValue(cardResult.getResponse().getContentAsString(), Account.class);
        assertThat(creditCard.getId()).isNotNull();

        // 6. GET /api/categories - retrieve system categories
        MvcResult catResult = mockMvc.perform(get("/api/categories")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        List<Category> categories = objectMapper.readValue(
                catResult.getResponse().getContentAsString(),
                new TypeReference<List<Category>>() {}
        );
        Long categoryId = categories.isEmpty() ? null : categories.get(0).getId();

        // 7. FLOW A: INCOME - Receive monthly salary into Savings Account (+50,000 INR)
        CreateTransactionRequest salaryTx = new CreateTransactionRequest();
        salaryTx.setTransactionType(TransactionType.INCOME);
        salaryTx.setAmount(new BigDecimal("50000.00"));
        salaryTx.setDestinationAccountId(savingsAccount.getId());
        salaryTx.setDescription("Monthly Salary Credit");
        salaryTx.setPayeeMerchant("Tech Corp");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(salaryTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(50000.00))
                .andExpect(jsonPath("$.transactionType").value("INCOME"));

        // 8. FLOW B: ATM WITHDRAWAL - Withdraw 3,000 INR from Savings to Cash Wallet
        CreateTransactionRequest atmTx = new CreateTransactionRequest();
        atmTx.setTransactionType(TransactionType.ATM_WITHDRAWAL);
        atmTx.setAmount(new BigDecimal("3000.00"));
        atmTx.setSourceAccountId(savingsAccount.getId());
        atmTx.setDestinationAccountId(cashWallet.getId());
        atmTx.setDescription("Cash withdrawal for weekly pocket money");
        atmTx.setPayeeMerchant("HDFC ATM");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(atmTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(3000.00))
                .andExpect(jsonPath("$.transactionType").value("ATM_WITHDRAWAL"));

        // 9. FLOW C: CASH EXPENSE - Spend 500 INR from Cash Wallet on groceries
        CreateTransactionRequest cashExpenseTx = new CreateTransactionRequest();
        cashExpenseTx.setTransactionType(TransactionType.EXPENSE);
        cashExpenseTx.setAmount(new BigDecimal("500.00"));
        cashExpenseTx.setSourceAccountId(cashWallet.getId());
        cashExpenseTx.setCategoryId(categoryId);
        cashExpenseTx.setDescription("Vegetables & Fruits");
        cashExpenseTx.setPayeeMerchant("Farmers Market");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cashExpenseTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(500.00))
                .andExpect(jsonPath("$.transactionType").value("EXPENSE"));

        // 10. FLOW D: CREDIT CARD EXPENSE - Spend 4,000 INR using Credit Card
        CreateTransactionRequest ccExpenseTx = new CreateTransactionRequest();
        ccExpenseTx.setTransactionType(TransactionType.EXPENSE);
        ccExpenseTx.setAmount(new BigDecimal("4000.00"));
        ccExpenseTx.setSourceAccountId(creditCard.getId());
        ccExpenseTx.setCategoryId(categoryId);
        ccExpenseTx.setDescription("Mechanical Keyboard");
        ccExpenseTx.setPayeeMerchant("Amazon");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ccExpenseTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(4000.00))
                .andExpect(jsonPath("$.transactionType").value("EXPENSE"));

        // 11. FLOW E: CREDIT CARD BILL PAYMENT - Pay 4,000 INR bill from Savings Account to Credit Card
        CreateTransactionRequest billPayTx = new CreateTransactionRequest();
        billPayTx.setTransactionType(TransactionType.CREDIT_CARD_PAYMENT);
        billPayTx.setAmount(new BigDecimal("4000.00"));
        billPayTx.setSourceAccountId(savingsAccount.getId());
        billPayTx.setDestinationAccountId(creditCard.getId());
        billPayTx.setDescription("HDFC CC Bill Settlement");
        billPayTx.setPayeeMerchant("HDFC NetBanking");

        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(billPayTx)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(4000.00))
                .andExpect(jsonPath("$.transactionType").value("CREDIT_CARD_PAYMENT"));

        // 12. VERIFY GET /api/transactions
        MvcResult allTxResult = mockMvc.perform(get("/api/transactions")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        List<?> recordedTxs = objectMapper.readValue(
                allTxResult.getResponse().getContentAsString(),
                List.class
        );
        assertThat(recordedTxs).hasSize(5);

        // 13. VERIFY FINAL ACCOUNT BALANCES REFLECT DOUBLE-ENTRY LEDGER ACCURACY
        MvcResult finalAccountsResult = mockMvc.perform(get("/api/accounts")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andReturn();

        List<Account> finalAccounts = objectMapper.readValue(
                finalAccountsResult.getResponse().getContentAsString(),
                new TypeReference<List<Account>>() {}
        );

        Account finalSavings = finalAccounts.stream()
                .filter(a -> a.getId().equals(savingsAccount.getId()))
                .findFirst().orElseThrow();
        Account finalCash = finalAccounts.stream()
                .filter(a -> a.getId().equals(cashWallet.getId()))
                .findFirst().orElseThrow();
        Account finalCard = finalAccounts.stream()
                .filter(a -> a.getId().equals(creditCard.getId()))
                .findFirst().orElseThrow();

        // Savings: 50,000 (salary) - 3,000 (ATM) - 4,000 (card bill pay) = 43,000.00
        assertThat(finalSavings.getCurrentBalance()).isEqualByComparingTo("43000.00");

        // Cash: 0 + 3,000 (ATM) - 500 (groceries) = 2,500.00
        assertThat(finalCash.getCurrentBalance()).isEqualByComparingTo("2500.00");

        // Credit Card: 0 + 4,000 (expense debt) - 4,000 (bill payment) = 0.00 debt
        assertThat(finalCard.getCurrentBalance()).isEqualByComparingTo("0.00");
    }
}
