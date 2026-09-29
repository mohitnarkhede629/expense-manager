package com.expensemanager.api.repository;

import com.expensemanager.api.model.Transaction;
import com.expensemanager.api.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.transactionType = :type")
    List<Transaction> findByUserIdAndTransactionType(@Param("userId") Long userId, @Param("type") TransactionType type);
}
