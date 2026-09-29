package com.expensemanager.api.repository;

import com.expensemanager.api.model.Account;
import com.expensemanager.api.model.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserIdAndIsActiveTrue(Long userId);
    List<Account> findByUserIdAndAccountType(Long userId, AccountType accountType);
}
