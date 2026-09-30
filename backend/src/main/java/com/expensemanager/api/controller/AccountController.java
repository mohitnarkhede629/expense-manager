package com.expensemanager.api.controller;

import com.expensemanager.api.model.Account;
import com.expensemanager.api.model.User;
import com.expensemanager.api.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountRepository accountRepository;

    @GetMapping
    public ResponseEntity<?> getAccounts(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not authenticated"));
        }
        return ResponseEntity.ok(accountRepository.findByUserIdAndIsActiveTrue(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createAccount(
            @AuthenticationPrincipal User user,
            @RequestBody Account account
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not authenticated"));
        }
        account.setUser(user);
        return ResponseEntity.ok(accountRepository.save(account));
    }

    @PostMapping("/batch")
    public ResponseEntity<?> createAccountsBatch(
            @AuthenticationPrincipal User user,
            @RequestBody List<Account> accounts
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not authenticated"));
        }
        if (accounts == null || accounts.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Accounts list cannot be empty"));
        }
        accounts.forEach(acc -> {
            acc.setUser(user);
            if (acc.getIsActive() == null) {
                acc.setIsActive(true);
            }
            if (acc.getCurrency() == null || acc.getCurrency().isBlank()) {
                acc.setCurrency(user.getBaseCurrency() != null ? user.getBaseCurrency() : "INR");
            }
        });
        List<Account> savedAccounts = accountRepository.saveAll(accounts);
        return ResponseEntity.ok(savedAccounts);
    }
}
