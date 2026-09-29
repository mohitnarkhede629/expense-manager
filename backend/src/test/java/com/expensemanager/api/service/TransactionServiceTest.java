package com.expensemanager.api.service;

import com.expensemanager.api.model.*;
import com.expensemanager.api.repository.AccountRepository;
import com.expensemanager.api.repository.CategoryRepository;
import com.expensemanager.api.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Account bankAccount;
    private Account cashAccount;
    private Account creditCardAccount;
    private Account investmentAccount;
    private Category groceriesCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("John Doe")
                .baseCurrency("INR")
                .build();

        bankAccount = Account.builder()
                .id(10L)
                .user(testUser)
                .name("HDFC Bank")
                .accountType(AccountType.SAVINGS)
                .currency("INR")
                .currentBalance(new BigDecimal("10000.00"))
                .isActive(true)
                .build();

        cashAccount = Account.builder()
                .id(20L)
                .user(testUser)
                .name("Wallet Cash")
                .accountType(AccountType.CASH)
                .currency("INR")
                .currentBalance(new BigDecimal("2000.00"))
                .isActive(true)
                .build();

        creditCardAccount = Account.builder()
                .id(30L)
                .user(testUser)
                .name("Amazon Pay ICICI Card")
                .accountType(AccountType.CREDIT_CARD)
                .currency("INR")
                .currentBalance(new BigDecimal("5000.00")) // 5,000 outstanding debt
                .creditLimit(new BigDecimal("100000.00"))
                .isActive(true)
                .build();

        investmentAccount = Account.builder()
                .id(40L)
                .user(testUser)
                .name("Zerodha Demat")
                .accountType(AccountType.INVESTMENT)
                .currency("INR")
                .currentBalance(new BigDecimal("50000.00"))
                .isActive(true)
                .build();

        groceriesCategory = Category.builder()
                .id(100L)
                .name("Groceries")
                .categoryType(CategoryType.EXPENSE)
                .build();
    }

    @Nested
    @DisplayName("Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Should throw exception when amount is null")
        void shouldThrowExceptionWhenAmountIsNull() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, null, LocalDateTime.now(),
                    10L, null, 100L, "Null amount test", "Store"
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Transaction amount must be strictly positive");
        }

        @Test
        @DisplayName("Should throw exception when amount is zero")
        void shouldThrowExceptionWhenAmountIsZero() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, BigDecimal.ZERO, LocalDateTime.now(),
                    10L, null, 100L, "Zero amount test", "Store"
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Transaction amount must be strictly positive");
        }

        @Test
        @DisplayName("Should throw exception when amount is negative")
        void shouldThrowExceptionWhenAmountIsNegative() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, new BigDecimal("-50.00"), LocalDateTime.now(),
                    10L, null, 100L, "Negative amount test", "Store"
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Transaction amount must be strictly positive");
        }

        @Test
        @DisplayName("Should throw exception when source account is not found")
        void shouldThrowExceptionWhenSourceAccountNotFound() {
            when(accountRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, new BigDecimal("100.00"), LocalDateTime.now(),
                    999L, null, 100L, "Missing account", "Store"
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Source account not found: 999");
        }

        @Test
        @DisplayName("Should throw exception when destination account is not found")
        void shouldThrowExceptionWhenDestinationAccountNotFound() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.TRANSFER, new BigDecimal("100.00"), LocalDateTime.now(),
                    10L, 999L, null, "Missing dest account", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Destination account not found: 999");
        }

        @Test
        @DisplayName("Should throw exception when source account belongs to another user")
        void shouldThrowExceptionWhenSourceAccountBelongsToAnotherUser() {
            User otherUser = User.builder().id(99L).build();
            Account otherAccount = Account.builder().id(10L).user(otherUser).build();
            when(accountRepository.findById(10L)).thenReturn(Optional.of(otherAccount));

            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, new BigDecimal("100.00"), LocalDateTime.now(),
                    10L, null, null, "Hacking test", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Source account does not belong to the authenticated user");
        }

        @Test
        @DisplayName("Should throw exception when destination account belongs to another user")
        void shouldThrowExceptionWhenDestinationAccountBelongsToAnotherUser() {
            User otherUser = User.builder().id(99L).build();
            Account otherAccount = Account.builder().id(20L).user(otherUser).build();
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(20L)).thenReturn(Optional.of(otherAccount));

            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.TRANSFER, new BigDecimal("100.00"), LocalDateTime.now(),
                    10L, 20L, null, "Transfer to stranger", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Destination account does not belong to the authenticated user");
        }
    }

    @Nested
    @DisplayName("Ledger Flow Tests")
    class LedgerFlowTests {

        @Test
        @DisplayName("Flow 1: EXPENSE from Bank decreases bank balance")
        void shouldDeductFromBankBalanceOnExpense() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(categoryRepository.findById(100L)).thenReturn(Optional.of(groceriesCategory));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal expenseAmount = new BigDecimal("1500.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, expenseAmount, LocalDateTime.now(),
                    10L, null, 100L, "Supermarket shopping", "BigBasket"
            );

            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("8500.00");
            verify(accountRepository).save(bankAccount);
            assertThat(tx.getStatus()).isEqualTo(TransactionStatus.CLEARED);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.EXPENSE);
            assertThat(tx.getAmount()).isEqualByComparingTo(expenseAmount);
            assertThat(tx.getSourceAccount()).isEqualTo(bankAccount);
        }

        @Test
        @DisplayName("Flow 2: EXPENSE from Cash Wallet decreases cash balance")
        void shouldDeductFromCashBalanceOnExpense() {
            when(accountRepository.findById(20L)).thenReturn(Optional.of(cashAccount));
            when(categoryRepository.findById(100L)).thenReturn(Optional.of(groceriesCategory));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal expenseAmount = new BigDecimal("250.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, expenseAmount, LocalDateTime.now(),
                    20L, null, 100L, "Vegetables", "Local Market"
            );

            assertThat(cashAccount.getCurrentBalance()).isEqualByComparingTo("1750.00");
            verify(accountRepository).save(cashAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.EXPENSE);
        }

        @Test
        @DisplayName("Flow 3: EXPENSE from Credit Card increases credit card liability/debt")
        void shouldIncreaseCreditCardLiabilityOnExpense() {
            when(accountRepository.findById(30L)).thenReturn(Optional.of(creditCardAccount));
            when(categoryRepository.findById(100L)).thenReturn(Optional.of(groceriesCategory));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal cardSwipe = new BigDecimal("3200.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, cardSwipe, LocalDateTime.now(),
                    30L, null, 100L, "Electronics purchase", "Amazon"
            );

            // Starting debt: 5,000 + 3,200 = 8,200
            assertThat(creditCardAccount.getCurrentBalance()).isEqualByComparingTo("8200.00");
            verify(accountRepository).save(creditCardAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.EXPENSE);
        }

        @Test
        @DisplayName("Flow 4: EXPENSE requires source account")
        void shouldThrowExceptionWhenExpenseHasNoSourceAccount() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, new BigDecimal("100.00"), LocalDateTime.now(),
                    null, null, null, "No account", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Expense requires a source account");
        }

        @Test
        @DisplayName("Flow 5: INCOME increases destination account balance")
        void shouldIncreaseDestinationBalanceOnIncome() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal salary = new BigDecimal("50000.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.INCOME, salary, LocalDateTime.now(),
                    null, 10L, null, "Monthly Salary", "Employer"
            );

            // 10,000 + 50,000 = 60,000
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("60000.00");
            verify(accountRepository).save(bankAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.INCOME);
            assertThat(tx.getDestinationAccount()).isEqualTo(bankAccount);
        }

        @Test
        @DisplayName("Flow 6: INCOME requires destination account")
        void shouldThrowExceptionWhenIncomeHasNoDestinationAccount() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.INCOME, new BigDecimal("500.00"), LocalDateTime.now(),
                    null, null, null, "No dest account", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Income requires a destination account");
        }

        @Test
        @DisplayName("Flow 7: ATM_WITHDRAWAL shifts money from Bank to Cash Wallet")
        void shouldHandleAtmWithdrawal() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(20L)).thenReturn(Optional.of(cashAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal withdrawalAmount = new BigDecimal("3000.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.ATM_WITHDRAWAL, withdrawalAmount, LocalDateTime.now(),
                    10L, 20L, null, "ATM Cash Withdrawal", "HDFC ATM"
            );

            // Bank: 10,000 - 3,000 = 7,000
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("7000.00");
            // Cash: 2,000 + 3,000 = 5,000
            assertThat(cashAccount.getCurrentBalance()).isEqualByComparingTo("5000.00");
            verify(accountRepository).save(bankAccount);
            verify(accountRepository).save(cashAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.ATM_WITHDRAWAL);
        }

        @Test
        @DisplayName("Flow 8: ATM_WITHDRAWAL requires both source and destination")
        void shouldThrowExceptionWhenAtmWithdrawalMissingAccounts() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));

            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.ATM_WITHDRAWAL, new BigDecimal("1000.00"), LocalDateTime.now(),
                    10L, null, null, "ATM fail", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("ATM Withdrawal requires both source Bank and destination Cash accounts");
        }

        @Test
        @DisplayName("Flow 9: CREDIT_CARD_PAYMENT reduces bank balance and card liability")
        void shouldHandleCreditCardPayment() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(30L)).thenReturn(Optional.of(creditCardAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal paymentAmount = new BigDecimal("4000.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.CREDIT_CARD_PAYMENT, paymentAmount, LocalDateTime.now(),
                    10L, 30L, null, "Card Bill Payment", "ICICI Bank"
            );

            // Bank: 10,000 - 4,000 = 6,000
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("6000.00");
            // Card debt: 5,000 - 4,000 = 1,000
            assertThat(creditCardAccount.getCurrentBalance()).isEqualByComparingTo("1000.00");
            verify(accountRepository).save(bankAccount);
            verify(accountRepository).save(creditCardAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.CREDIT_CARD_PAYMENT);
        }

        @Test
        @DisplayName("Flow 10: CREDIT_CARD_PAYMENT requires both source and destination")
        void shouldThrowExceptionWhenCreditCardPaymentMissingAccounts() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.CREDIT_CARD_PAYMENT, new BigDecimal("2000.00"), LocalDateTime.now(),
                    null, null, null, "Card payment fail", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Credit card payment requires source Bank and target Credit Card");
        }

        @Test
        @DisplayName("Flow 11: INVESTMENT_DEPOSIT shifts funds from Bank to Investment")
        void shouldHandleInvestmentDeposit() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(40L)).thenReturn(Optional.of(investmentAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal investment = new BigDecimal("5000.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.INVESTMENT_DEPOSIT, investment, LocalDateTime.now(),
                    10L, 40L, null, "Mutual Fund SIP", "Zerodha"
            );

            // Bank: 10,000 - 5,000 = 5,000
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("5000.00");
            // Investment: 50,000 + 5,000 = 55,000
            assertThat(investmentAccount.getCurrentBalance()).isEqualByComparingTo("55000.00");
            verify(accountRepository).save(bankAccount);
            verify(accountRepository).save(investmentAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.INVESTMENT_DEPOSIT);
        }

        @Test
        @DisplayName("Flow 12: INVESTMENT_DEPOSIT requires both accounts")
        void shouldThrowExceptionWhenInvestmentDepositMissingAccounts() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.INVESTMENT_DEPOSIT, new BigDecimal("1000.00"), LocalDateTime.now(),
                    null, null, null, "Deposit fail", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Investment deposit requires source Bank and target Investment account");
        }

        @Test
        @DisplayName("Flow 13: INVESTMENT_WITHDRAWAL shifts funds from Investment to Bank")
        void shouldHandleInvestmentWithdrawal() {
            when(accountRepository.findById(40L)).thenReturn(Optional.of(investmentAccount));
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal redemption = new BigDecimal("10000.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.INVESTMENT_WITHDRAWAL, redemption, LocalDateTime.now(),
                    40L, 10L, null, "Mutual Fund Redemption", "Zerodha"
            );

            // Investment: 50,000 - 10,000 = 40,000
            assertThat(investmentAccount.getCurrentBalance()).isEqualByComparingTo("40000.00");
            // Bank: 10,000 + 10,000 = 20,000
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("20000.00");
            verify(accountRepository).save(investmentAccount);
            verify(accountRepository).save(bankAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.INVESTMENT_WITHDRAWAL);
        }

        @Test
        @DisplayName("Flow 14: INVESTMENT_WITHDRAWAL requires both accounts")
        void shouldThrowExceptionWhenInvestmentWithdrawalMissingAccounts() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.INVESTMENT_WITHDRAWAL, new BigDecimal("1000.00"), LocalDateTime.now(),
                    null, null, null, "Withdrawal fail", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Investment withdrawal requires source Investment and target Bank account");
        }

        @Test
        @DisplayName("Flow 15: TRANSFER shifts funds between two accounts")
        void shouldHandleInternalTransfer() {
            Account secondaryBankAccount = Account.builder()
                    .id(15L)
                    .name("SBI Savings")
                    .accountType(AccountType.SAVINGS)
                    .currentBalance(new BigDecimal("1000.00"))
                    .build();

            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(accountRepository.findById(15L)).thenReturn(Optional.of(secondaryBankAccount));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            BigDecimal transferAmount = new BigDecimal("2500.00");
            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.TRANSFER, transferAmount, LocalDateTime.now(),
                    10L, 15L, null, "Transfer to SBI", null
            );

            // Bank: 10,000 - 2,500 = 7,500
            assertThat(bankAccount.getCurrentBalance()).isEqualByComparingTo("7500.00");
            // SBI: 1,000 + 2,500 = 3,500
            assertThat(secondaryBankAccount.getCurrentBalance()).isEqualByComparingTo("3500.00");
            verify(accountRepository).save(bankAccount);
            verify(accountRepository).save(secondaryBankAccount);
            assertThat(tx.getTransactionType()).isEqualTo(TransactionType.TRANSFER);
        }

        @Test
        @DisplayName("Flow 16: TRANSFER requires both accounts")
        void shouldThrowExceptionWhenTransferMissingAccounts() {
            assertThatThrownBy(() -> transactionService.recordTransaction(
                    testUser, TransactionType.TRANSFER, new BigDecimal("1000.00"), LocalDateTime.now(),
                    null, null, null, "Transfer fail", null
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Internal transfer requires source and destination accounts");
        }

        @Test
        @DisplayName("Flow 17: Should default transaction date to now if null")
        void shouldDefaultTransactionDateToNowIfNull() {
            when(accountRepository.findById(10L)).thenReturn(Optional.of(bankAccount));
            when(categoryRepository.findById(100L)).thenReturn(Optional.of(groceriesCategory));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

            Transaction tx = transactionService.recordTransaction(
                    testUser, TransactionType.EXPENSE, new BigDecimal("100.00"), null,
                    10L, null, 100L, "No date", "Store"
            );

            assertThat(tx.getTransactionDate()).isNotNull();
        }

        @Test
        @DisplayName("Flow 18: getUserTransactions delegates to repository")
        void shouldGetUserTransactions() {
            List<Transaction> expectedList = List.of(
                    Transaction.builder().id(1L).amount(new BigDecimal("100.00")).build(),
                    Transaction.builder().id(2L).amount(new BigDecimal("200.00")).build()
            );
            when(transactionRepository.findByUserIdOrderByTransactionDateDesc(1L)).thenReturn(expectedList);

            List<Transaction> actual = transactionService.getUserTransactions(1L);

            assertThat(actual).hasSize(2).isEqualTo(expectedList);
            verify(transactionRepository).findByUserIdOrderByTransactionDateDesc(1L);
        }
    }
}
