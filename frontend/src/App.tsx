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
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { LoginScreen } from './components/LoginScreen';
import { useFinancial } from './context/FinancialContext';

export const AuthenticatedContent: React.FC = () => {
  const { user } = useAuth();
  const { accounts, loading } = useFinancial();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isNewTxOpen, setIsNewTxOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState<boolean>(false);

  // Automatically trigger wizard on first login if accounts.length === 0 and user has not dismissed it
  React.useEffect(() => {
    if (!loading && !hasCheckedOnboarding && user?.id) {
      setHasCheckedOnboarding(true);
      const isDismissed = localStorage.getItem(`dismissed_onboarding_${user.id}`);
      if (accounts.length === 0 && !isDismissed) {
        setIsWizardOpen(true);
      }
    }
  }, [loading, hasCheckedOnboarding, accounts.length, user?.id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTx={() => setIsNewTxOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenNewTx={() => setIsNewTxOpen(true)}
            setActiveTab={setActiveTab}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        )}
        {activeTab === 'accounts' && <AccountsList />}
        {activeTab === 'transactions' && (
          <TransactionsList onOpenNewTx={() => setIsNewTxOpen(true)} />
        )}
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

      {/* Step-by-Step Guided Setup Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
      <AuthenticatedContent />
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
