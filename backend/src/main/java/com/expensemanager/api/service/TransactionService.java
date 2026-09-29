package com.expensemanager.api.service;

import com.expensemanager.api.model.*;
import com.expensemanager.api.repository.AccountRepository;
import com.expensemanager.api.repository.CategoryRepository;
import com.expensemanager.api.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public Transaction recordTransaction(
            User user,
            TransactionType type,
            BigDecimal amount,
            LocalDateTime txDate,
            Long sourceAccountId,
            Long destinationAccountId,
            Long categoryId,
            String description,
            String payeeMerchant
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transaction amount must be strictly positive");
        }

        Account sourceAccount = sourceAccountId != null
                ? accountRepository.findById(sourceAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("Source account not found: " + sourceAccountId))
                : null;

        Account destinationAccount = destinationAccountId != null
                ? accountRepository.findById(destinationAccountId)
                    .orElseThrow(() -> new IllegalArgumentException("Destination account not found: " + destinationAccountId))
                : null;

        if (user != null && sourceAccount != null && sourceAccount.getUser() != null
                && !sourceAccount.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Source account does not belong to the authenticated user");
        }

        if (user != null && destinationAccount != null && destinationAccount.getUser() != null
                && !destinationAccount.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Destination account does not belong to the authenticated user");
        }

        Category category = categoryId != null
                ? categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + categoryId))
                : null;

        // Apply double-entry ledger balance updates
        switch (type) {
            case EXPENSE -> {
                if (sourceAccount == null) {
                    throw new IllegalArgumentException("Expense requires a source account");
                }
                if (sourceAccount.getAccountType() == AccountType.CREDIT_CARD) {
                    // Spending on Credit Card increases card liability/debt
                    sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().add(amount));
                } else {
                    // Spending from Bank or Cash decreases balance
                    sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                }
                accountRepository.save(sourceAccount);
            }

            case INCOME -> {
                if (destinationAccount == null) {
                    throw new IllegalArgumentException("Income requires a destination account");
                }
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().add(amount));
                accountRepository.save(destinationAccount);
            }

            case ATM_WITHDRAWAL -> {
                if (sourceAccount == null || destinationAccount == null) {
                    throw new IllegalArgumentException("ATM Withdrawal requires both source Bank and destination Cash accounts");
                }
                // Money moves from Bank -> Cash Wallet
                sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().add(amount));
                accountRepository.save(sourceAccount);
                accountRepository.save(destinationAccount);
            }

            case CREDIT_CARD_PAYMENT -> {
                if (sourceAccount == null || destinationAccount == null) {
                    throw new IllegalArgumentException("Credit card payment requires source Bank and target Credit Card");
                }
                // Source Bank pays, reducing bank balance
                sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                // Destination Credit Card debt decreases
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().subtract(amount));
                accountRepository.save(sourceAccount);
                accountRepository.save(destinationAccount);
            }

            case INVESTMENT_DEPOSIT -> {
                if (sourceAccount == null || destinationAccount == null) {
                    throw new IllegalArgumentException("Investment deposit requires source Bank and target Investment account");
                }
                // Bank cash moves into Investment valuation
                sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().add(amount));
                accountRepository.save(sourceAccount);
                accountRepository.save(destinationAccount);
            }

            case INVESTMENT_WITHDRAWAL -> {
                if (sourceAccount == null || destinationAccount == null) {
                    throw new IllegalArgumentException("Investment withdrawal requires source Investment and target Bank account");
                }
                sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().add(amount));
                accountRepository.save(sourceAccount);
                accountRepository.save(destinationAccount);
            }

            case TRANSFER -> {
                if (sourceAccount == null || destinationAccount == null) {
                    throw new IllegalArgumentException("Internal transfer requires source and destination accounts");
                }
                sourceAccount.setCurrentBalance(sourceAccount.getCurrentBalance().subtract(amount));
                destinationAccount.setCurrentBalance(destinationAccount.getCurrentBalance().add(amount));
                accountRepository.save(sourceAccount);
                accountRepository.save(destinationAccount);
            }
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .transactionType(type)
                .amount(amount)
                .transactionDate(txDate != null ? txDate : LocalDateTime.now())
                .sourceAccount(sourceAccount)
                .destinationAccount(destinationAccount)
                .category(category)
                .description(description)
                .payeeMerchant(payeeMerchant)
                .status(TransactionStatus.CLEARED)
                .build();

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
    }
}
