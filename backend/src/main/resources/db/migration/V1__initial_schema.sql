-- ==========================================================
-- V1__initial_schema.sql
-- Expense & Wealth Manager Initial Schema
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Accounts Table (Bank, Credit Cards, Cash, Investments)
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(30) NOT NULL, -- SAVINGS, CHECKING, CREDIT_CARD, INVESTMENT, CASH, WALLET
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    institution_name VARCHAR(100) NULL,
    account_number_last4 VARCHAR(4) NULL,
    -- Credit Card specific fields
    credit_limit DECIMAL(15, 2) NULL,
    billing_cycle_day INT NULL,
    payment_due_day INT NULL,
    interest_rate_apr DECIMAL(5, 2) NULL,
    -- Investment specific fields
    investment_type VARCHAR(50) NULL, -- MUTUAL_FUNDS, STOCKS, FIXED_DEPOSIT, EPF_PPF, GOLD, CRYPTO, REAL_ESTATE
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_account_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Table (Hierarchical Parent/Child)
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL, -- NULL means default system category available to all
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL, -- EXPENSE, INCOME
    parent_id BIGINT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    color VARCHAR(20) NOT NULL DEFAULT '#64748B',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category_type (category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Transactions Table (Double-Entry Ledger Foundation)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- EXPENSE, INCOME, TRANSFER, CREDIT_CARD_PAYMENT, INVESTMENT_DEPOSIT, INVESTMENT_WITHDRAWAL, ATM_WITHDRAWAL
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date DATETIME NOT NULL,
    source_account_id BIGINT NULL,
    destination_account_id BIGINT NULL,
    category_id BIGINT NULL,
    description VARCHAR(255) NULL,
    payee_merchant VARCHAR(150) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CLEARED', -- CLEARED, PENDING, RECONCILED
    reference_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_source_account FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_tx_dest_account FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_tx_user_date (user_id, transaction_date),
    INDEX idx_tx_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Investment Holdings Table
CREATE TABLE IF NOT EXISTS investment_holdings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    asset_name VARCHAR(150) NOT NULL,
    asset_category VARCHAR(50) NOT NULL, -- EQUITY, DEBT, GOLD, FD, HYBRID
    units DECIMAL(15, 4) NULL,
    average_buy_price DECIMAL(15, 2) NULL,
    invested_amount DECIMAL(15, 2) NOT NULL,
    current_valuation DECIMAL(15, 2) NOT NULL,
    last_valuation_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_holding_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_holding_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    monthly_limit DECIMAL(15, 2) NOT NULL,
    alert_threshold_percentage INT NOT NULL DEFAULT 80,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_budget_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default System Seed Categories
INSERT INTO categories (user_id, name, category_type, parent_id, icon, color, is_system) VALUES
(NULL, 'Food & Dining', 'EXPENSE', NULL, 'Utensils', '#EF4444', TRUE),
(NULL, 'Housing & Utilities', 'EXPENSE', NULL, 'Home', '#3B82F6', TRUE),
(NULL, 'Transportation', 'EXPENSE', NULL, 'Car', '#F59E0B', TRUE),
(NULL, 'Shopping', 'EXPENSE', NULL, 'ShoppingBag', '#8B5CF6', TRUE),
(NULL, 'Healthcare', 'EXPENSE', NULL, 'HeartPulse', '#EC4899', TRUE),
(NULL, 'Entertainment', 'EXPENSE', NULL, 'Film', '#06B6D4', TRUE),
(NULL, 'Personal Care', 'EXPENSE', NULL, 'Smile', '#10B981', TRUE),
(NULL, 'Salary', 'INCOME', NULL, 'Briefcase', '#22C55E', TRUE),
(NULL, 'Freelance / Business', 'INCOME', NULL, 'Laptop', '#14B8A6', TRUE),
(NULL, 'Investment Return', 'INCOME', NULL, 'TrendingUp', '#6366F1', TRUE);
