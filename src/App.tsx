import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TransferModal } from './components/TransferModal';
import { DashboardView } from './views/DashboardView';
import { PendientesView } from './views/PendientesView';
import { InitialSetupView } from './views/InitialSetupView';
import { NewTransactionView } from './views/NewTransactionView';
import { NewPendingView } from './views/NewPendingView';
import { EstadisticasView } from './views/EstadisticasView';
import { LoginView } from './views/LoginView';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <div className="flex-1">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'pendientes' && <PendientesView />}
        {currentView === 'estadisticas' && <EstadisticasView />}
        {currentView === 'setup' && <InitialSetupView />}
        {currentView === 'login' && <LoginView />}
        {currentView === 'new-transaction' && <NewTransactionView />}
        {currentView === 'new-pending' && <NewPendingView />}
      </div>
      <TransferModal />
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
