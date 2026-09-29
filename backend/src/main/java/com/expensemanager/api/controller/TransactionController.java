package com.expensemanager.api.controller;

import com.expensemanager.api.dto.CreateTransactionRequest;
import com.expensemanager.api.model.Transaction;
import com.expensemanager.api.model.User;
import com.expensemanager.api.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<?> getTransactions(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not authenticated"));
        }
        return ResponseEntity.ok(transactionService.getUserTransactions(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> recordTransaction(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not authenticated"));
        }

        try {
            Transaction savedTx = transactionService.recordTransaction(
                    user,
                    request.getTransactionType(),
                    request.getAmount(),
                    request.getTransactionDate(),
                    request.getSourceAccountId(),
                    request.getDestinationAccountId(),
                    request.getCategoryId(),
                    request.getDescription(),
                    request.getPayeeMerchant()
            );

            return ResponseEntity.ok(savedTx);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
