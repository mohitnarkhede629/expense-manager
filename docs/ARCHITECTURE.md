# Expense & Wealth Manager — System Architecture & Entity Plan

## 1. System Overview

The Expense Manager is a personal finance and wealth management system engineered with a **double-entry ledger foundation**. It models real-world multi-account banking, separate investment tracking, and credit card lifecycles without double-counting transfers or bill payments.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Layer (PWA & Web)"]
        WEB["React + TypeScript (Vite)"]
        PWA["PWA Service Worker & Manifest\n(Installable on Android & Desktop)"]
        STORE["Zustand / TanStack Query (State & Cache)"]
    end

    subgraph APILayer ["Backend API Layer (Spring Boot 3)"]
        AUTH["Spring Security (JWT Filter)"]
        ACCT_CTRL["Account Controller"]
        TX_CTRL["Transaction Controller (Ledger Engine)"]
        ANALYTICS_CTRL["Analytics & Reporting Controller"]
        BUDGET_CTRL["Budget Controller"]
    end

    subgraph ServiceLayer ["Service Layer"]
        TX_SVC["Transaction & Ledger Service\n(@Transactional)"]
        ANALYTICS_SVC["Analytics Aggregation Service"]
        ACCT_SVC["Account Management Service"]
    end

    subgraph DataLayer ["Data Layer (MySQL 8)"]
        FLYWAY["Flyway Migrations"]
        DB[(MySQL Database)]
    end

    WEB --> AUTH
    PWA -.-> WEB
    AUTH --> ACCT_CTRL & TX_CTRL & ANALYTICS_CTRL & BUDGET_CTRL
    ACCT_CTRL --> ACCT_SVC
    TX_CTRL --> TX_SVC
    ANALYTICS_CTRL --> ANALYTICS_SVC
    ACCT_SVC & TX_SVC & ANALYTICS_SVC --> DB
    FLYWAY -.-> DB
```

---

## 2. The Core Financial Ledger Model

In personal finance, treating all transactions as a simple `amount` field causes major accounting errors (such as credit card payments or transfers to savings showing up as expenses).

The table below defines how each transaction type behaves:

| Transaction Type | Source Account | Destination Account | Category | Impact on Net Worth | Counted as Expense? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EXPENSE** (from Bank) | Bank Account ($-$) | *None* | Expense Category | Decreases Net Worth | **YES** |
| **EXPENSE** (from Card) | Credit Card ($+$ Debt) | *None* | Expense Category | Decreases Net Worth | **YES** |
| **INCOME** | *None* | Bank Account ($+$) | Income Category | Increases Net Worth | **NO** (Income) |
| **INTERNAL TRANSFER** | Bank Account A ($-$) | Bank Account B ($+$) | *None* | Zero impact | **NO** |
| **CREDIT CARD PAYMENT** | Bank Account ($-$) | Credit Card ($-$ Debt) | *None* | Zero impact | **NO** |
| **INVESTMENT DEPOSIT** | Bank Account ($-$) | Investment Account ($+$) | *None* | Zero impact (Asset shift) | **NO** |
| **INVESTMENT WITHDRAWAL**| Investment Account ($-$) | Bank Account ($+$) | *None* | Zero impact (Asset shift) | **NO** |

---

## 3. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : owns
    USERS ||--o{ CATEGORIES : configures
    USERS ||--o{ TRANSACTIONS : records
    USERS ||--o{ BUDGETS : sets

    ACCOUNTS ||--o{ TRANSACTIONS : "source of"
    ACCOUNTS ||--o{ TRANSACTIONS : "destination of"
    ACCOUNTS ||--o{ INVESTMENT_HOLDINGS : contains

    CATEGORIES ||--o{ CATEGORIES : "parent of"
    CATEGORIES ||--o{ TRANSACTIONS : classifies
    CATEGORIES ||--o{ BUDGETS : targets

    USERS {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar base_currency
        timestamp created_at
    }

    ACCOUNTS {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar account_type "SAVINGS, CHECKING, CREDIT_CARD, INVESTMENT, CASH"
        varchar currency
        decimal current_balance
        varchar institution_name
        varchar account_number_last4
        decimal credit_limit "For Credit Cards"
        int billing_cycle_day "For Credit Cards (1-31)"
        int payment_due_day "For Credit Cards (1-31)"
        varchar investment_type "For Investments: MUTUAL_FUNDS, STOCKS, FD, etc."
        boolean is_active
        timestamp created_at
    }

    CATEGORIES {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar category_type "EXPENSE, INCOME"
        bigint parent_id FK "Self-referencing for subcategories"
        varchar icon
        varchar color
        boolean is_system
    }

    TRANSACTIONS {
        bigint id PK
        bigint user_id FK
        varchar transaction_type "EXPENSE, INCOME, TRANSFER, CC_PAYMENT, INVESTMENT_DEPOSIT"
        decimal amount
        datetime transaction_date
        bigint source_account_id FK
        bigint destination_account_id FK
        bigint category_id FK
        varchar description
        varchar payee_merchant
        varchar status "CLEARED, PENDING, RECONCILED"
        varchar reference_id "UPI / Bank ref"
        timestamp created_at
    }

    INVESTMENT_HOLDINGS {
        bigint id PK
        bigint account_id FK
        varchar asset_name
        varchar asset_category "EQUITY, DEBT, GOLD, FD"
        decimal units
        decimal average_buy_price
        decimal invested_amount
        decimal current_valuation
        date last_valuation_date
    }

    BUDGETS {
        bigint id PK
        bigint user_id FK
        bigint category_id FK
        decimal monthly_limit
        int alert_threshold_percentage
        boolean is_active
    }
```

---

## 4. Entity Details & Schema Strategy

### A. `users`
* Supports single-user personal deployment initially, but built multi-tenant from day one so you can share or expand in the future without schema rewrites.
* Default currency (e.g., `INR`, `USD`).

### B. `accounts`
* Unifies all financial locations:
  1. **Bank Accounts** (`SAVINGS`, `CHECKING`): Balance represents positive liquid cash.
  2. **Credit Cards** (`CREDIT_CARD`): Balance represents outstanding debt/liability. Has `credit_limit`, `billing_cycle_day`, and `payment_due_day`.
     * *Available Credit* = `credit_limit - current_balance`.
     * *Utilization Rate* = `(current_balance / credit_limit) * 100`.
  3. **Investment Accounts** (`INVESTMENT`): Portfolio accounts holding assets (Mutual Funds, Demat, Fixed Deposits, EPF/PPF).
  4. **Physical Cash / Wallets** (`CASH`, `WALLET`).

### C. `categories`
* Two-level hierarchy via `parent_id` (e.g., Parent: `Food & Dining` $\rightarrow$ Children: `Groceries`, `Restaurants`, `Coffee`).
* Accompanied by UI icons (Lucide icon identifier) and color tags for charts.

### D. `transactions`
* The atomic unit of money movement.
* Enforces strict validation:
  * If `EXPENSE`: `source_account_id` and `category_id` are required.
  * If `INCOME`: `destination_account_id` and `category_id` are required.
  * If `TRANSFER` / `CREDIT_CARD_PAYMENT` / `INVESTMENT_DEPOSIT`: both `source_account_id` and `destination_account_id` are required; `category_id` is null.

### E. `investment_holdings`
* Allows tracking separate investment instruments inside each investment account (e.g. Parag Parikh Flexi Cap Fund inside Groww/Zerodha account).
* Tracks both **invested amount** and **current valuation**, letting you monitor unrealized gains/losses over time.

---

## 5. Analytics & Aggregation Engine

The application provides real-time metrics across 3 analytical time frames: **Weekly**, **Monthly**, and **Yearly**:

1. **Cash Flow Breakdown**:
   $$\text{Net Cash Flow} = \text{Total Income} - \text{Total Expenses}$$
2. **True Net Worth**:
   $$\text{Net Worth} = \sum (\text{Bank Assets} + \text{Investments} + \text{Cash}) - \sum (\text{Credit Card Outstandings})$$
3. **Savings & Investment Rate**:
   $$\text{Investment Rate} = \frac{\text{Invested Amount}}{\text{Total Income}} \times 100$$
4. **Credit Card Health**:
   * Outstanding statement balance vs unbilled balance.
   * Days remaining until due date.
   * Total credit utilization across all cards.
