# Expense & Wealth Manager

A personal finance, multi-account banking, and investment management system with deep support for credit card lifecycles and analytics across weekly, monthly, and yearly horizons.

---

## Key Features

- **Multi-Account Banking**: Manage multiple savings, checking, and cash accounts.
- **Double-Entry Ledger Accounting**:
  - Proper credit card tracking (purchases recorded as expenses, bill payoffs handled as liability transfers without double-counting).
  - Separate savings and investment portfolio allocations without skewing expense totals.
- **Credit Card Lifecycle Management**: Track card balances, credit limits, utilization rates, billing cycle dates, and payment due dates.
- **Multi-Horizon Analytics**: Real-time cash flow and category breakdown across weekly, monthly, and yearly timelines.
- **Net Worth Tracking**: Total Assets (Bank balances + Investments + Cash) minus Total Liabilities (Credit cards).
- **Cross-Platform Access**: Progressive Web App (PWA) deployable on Desktop and installable directly on Android.

---

## Tech Stack

- **Backend**: Java 21, Spring Boot 3, Spring Data JPA, Spring Security (JWT), Flyway
- **Database**: MySQL 8
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Vite PWA
- **Architecture**: Monorepo with dedicated `backend/` and `frontend/` workspaces

---

## Project Structure

```text
expense-manager/
├── .gitignore
├── README.md
├── docs/
│   └── ARCHITECTURE.md       # Detailed entity diagrams, schema, and ledger logic
├── backend/                  # Spring Boot 3 REST API
└── frontend/                 # React + TypeScript + Vite PWA
```

---

## Architecture & Schema Reference

For comprehensive details on entity relationships, ledger mechanics, and API design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
