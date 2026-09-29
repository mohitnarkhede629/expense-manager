import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AccountsList } from './components/AccountsList';
import { TransactionsList } from './components/TransactionsList';
import { CreditCardsView } from './components/CreditCardsView';
import { AnalyticsView } from './components/AnalyticsView';
import { NewTransactionModal } from './components/NewTransactionModal';
import { LoginScreen } from './components/LoginScreen';

export const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNewTxOpen, setIsNewTxOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <FinancialProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewTx={() => setIsNewTxOpen(true)}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenNewTx={() => setIsNewTxOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'accounts' && <AccountsList />}
          {activeTab === 'transactions' && <TransactionsList />}
          {activeTab === 'cards' && (
            <CreditCardsView onOpenNewTx={() => setIsNewTxOpen(true)} />
          )}
          {activeTab === 'analytics' && <AnalyticsView />}
        </main>

        {/* Transaction Entry Modal */}
        <NewTransactionModal
          isOpen={isNewTxOpen}
          onClose={() => setIsNewTxOpen(false)}
        />
      </div>
    </FinancialProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
