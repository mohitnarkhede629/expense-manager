export type AccountType = 
  | 'SAVINGS' 
  | 'CHECKING' 
  | 'CREDIT_CARD' 
  | 'INVESTMENT' 
  | 'CASH' 
  | 'WALLET';

export type InvestmentType = 
  | 'MUTUAL_FUNDS' 
  | 'STOCKS' 
  | 'FIXED_DEPOSIT' 
  | 'EPF_PPF' 
  | 'GOLD' 
  | 'CRYPTO' 
  | 'REAL_ESTATE';

export interface Account {
  id: number;
  userId: number;
  name: string;
  accountType: AccountType;
  currency: string;
  currentBalance: number;
  institutionName?: string;
  accountNumberLast4?: string;
  // Credit Card fields
  creditLimit?: number;
  billingCycleDay?: number;
  paymentDueDay?: number;
  interestRateApr?: number;
  // Investment fields
  investmentType?: InvestmentType;
  isActive: boolean;
}

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: number;
  userId?: number;
  name: string;
  categoryType: CategoryType;
  parentId?: number;
  icon: string;
  color: string;
  isSystem: boolean;
}

export type TransactionType = 
  | 'EXPENSE' 
  | 'INCOME' 
  | 'TRANSFER' 
  | 'ATM_WITHDRAWAL' 
  | 'CREDIT_CARD_PAYMENT' 
  | 'INVESTMENT_DEPOSIT' 
  | 'INVESTMENT_WITHDRAWAL';

export type TransactionStatus = 'CLEARED' | 'PENDING' | 'RECONCILED';

export interface Transaction {
  id: number;
  userId: number;
  transactionType: TransactionType;
  amount: number;
  transactionDate: string;
  sourceAccountId?: number;
  destinationAccountId?: number;
  categoryId?: number;
  description?: string;
  payeeMerchant?: string;
  status: TransactionStatus;
  referenceId?: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  cashAndBankTotal: number;
  investmentsTotal: number;
  creditCardDebtTotal: number;
}
