import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TransferModal } from './components/TransferModal';
import { PayCreditCardModal } from './components/PayCreditCardModal';
import { DashboardView } from './views/DashboardView';

// El Inicio va en el paquete principal; el resto de vistas se descarga al abrirlas
const PendientesView = lazy(() => import('./views/PendientesView').then((m) => ({ default: m.PendientesView })));
const TarjetaView = lazy(() => import('./views/TarjetaView').then((m) => ({ default: m.TarjetaView })));
const InitialSetupView = lazy(() =>
  import('./views/InitialSetupView').then((m) => ({ default: m.InitialSetupView }))
);
const NewTransactionView = lazy(() =>
  import('./views/NewTransactionView').then((m) => ({ default: m.NewTransactionView }))
);
const NewPendingView = lazy(() => import('./views/NewPendingView').then((m) => ({ default: m.NewPendingView })));
const EstadisticasView = lazy(() =>
  import('./views/EstadisticasView').then((m) => ({ default: m.EstadisticasView }))
);
const LoginView = lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      <div className="flex-1">
        <Suspense fallback={null}>
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'pendientes' && <PendientesView />}
          {currentView === 'tarjeta' && <TarjetaView />}
          {currentView === 'estadisticas' && <EstadisticasView />}
          {currentView === 'setup' && <InitialSetupView />}
          {currentView === 'login' && <LoginView />}
          {currentView === 'new-transaction' && <NewTransactionView />}
          {currentView === 'new-pending' && <NewPendingView />}
        </Suspense>
      </div>
      <TransferModal />
      <PayCreditCardModal />
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
