package com.expensemanager.api.dto;

import com.expensemanager.api.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateTransactionRequest {

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private LocalDateTime transactionDate;

    private Long sourceAccountId;

    private Long destinationAccountId;

    private Long categoryId;

    private String description;

    private String payeeMerchant;
}
