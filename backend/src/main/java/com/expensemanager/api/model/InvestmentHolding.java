package com.expensemanager.api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_holdings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "asset_name", nullable = false, length = 150)
    private String assetName;

    @Column(name = "asset_category", nullable = false, length = 50)
    private String assetCategory;

    @Column(precision = 15, scale = 4)
    private BigDecimal units;

    @Column(name = "average_buy_price", precision = 15, scale = 2)
    private BigDecimal averageBuyPrice;

    @Column(name = "invested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal investedAmount;

    @Column(name = "current_valuation", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentValuation;

    @Column(name = "last_valuation_date", nullable = false)
    private LocalDate lastValuationDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
