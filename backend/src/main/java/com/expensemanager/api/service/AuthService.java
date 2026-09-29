package com.expensemanager.api.service;

import com.expensemanager.api.dto.AuthResponse;
import com.expensemanager.api.dto.LoginRequest;
import com.expensemanager.api.dto.RegisterRequest;
import com.expensemanager.api.model.Account;
import com.expensemanager.api.model.AccountType;
import com.expensemanager.api.model.User;
import com.expensemanager.api.repository.AccountRepository;
import com.expensemanager.api.repository.UserRepository;
import com.expensemanager.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .baseCurrency(request.getBaseCurrency() != null ? request.getBaseCurrency() : "INR")
                .build();

        User savedUser = userRepository.save(user);

        // Auto-seed starter accounts for new user: Primary Bank Account & Physical Cash Wallet
        Account bankAccount = Account.builder()
                .user(savedUser)
                .name("Primary Savings Account")
                .accountType(AccountType.SAVINGS)
                .currency(savedUser.getBaseCurrency())
                .currentBalance(BigDecimal.ZERO)
                .institutionName("Bank")
                .isActive(true)
                .build();

        Account cashAccount = Account.builder()
                .user(savedUser)
                .name("Physical Cash Wallet")
                .accountType(AccountType.CASH)
                .currency(savedUser.getBaseCurrency())
                .currentBalance(BigDecimal.ZERO)
                .institutionName("Cash")
                .isActive(true)
                .build();

        accountRepository.save(bankAccount);
        accountRepository.save(cashAccount);

        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .baseCurrency(savedUser.getBaseCurrency())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .baseCurrency(user.getBaseCurrency())
                .build();
    }
}
