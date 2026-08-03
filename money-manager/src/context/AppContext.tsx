import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, PendingItem, ViewMode, UserProfile } from '../types';

interface AppContextType {
  walletBalance: number;
  investmentBalance: number;
  categories: string[];
  transactions: Transaction[];
  pendingItems: PendingItem[];
  currentView: ViewMode;
  isTransferModalOpen: boolean;
  editingPendingItem: PendingItem | null;
  user: UserProfile;
  setCurrentView: (view: ViewMode) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setEditingPendingItem: (item: PendingItem | null) => void;
  updateBalances: (wallet: number, investment: number) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addPendingItem: (item: Omit<PendingItem, 'id'>) => void;
  updatePendingItem: (item: PendingItem) => void;
  deletePendingItem: (id: string) => void;
  markPendingAsPaid: (id: string, customAmount?: number) => void;
  transferFunds: (amount: number, direction: 'walletToInv' | 'invToWallet') => boolean;
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string) => void;
  logout: () => void;
}


const DEFAULT_CATEGORIES = [
  'Arriendo',
  'Servicios',
  'Suscripciones',
  'Transporte',
  'Compras',
  'Comida',
  'Mercado',
  'Educación',
  'Banco',
  'Salario',
  'I. Extra',
  'Deuda',
  'Inversiones',
  'Otros',
];

export const calculateNextDueDate = (
  dueDate: string | null,
  recurrence: string,
  stepCount: number = 1
): string | null => {
  if (!recurrence || recurrence === 'none') return dueDate;

  const baseDate = dueDate ? new Date(dueDate + 'T00:00:00') : new Date();

  switch (recurrence) {
    case '1w':
    case 'semanal':
      baseDate.setDate(baseDate.getDate() + 7 * stepCount);
      break;
    case '1m':
    case 'mensual':
      baseDate.setMonth(baseDate.getMonth() + 1 * stepCount);
      break;
    case '2m':
    case 'bimensual':
      baseDate.setMonth(baseDate.getMonth() + 2 * stepCount);
      break;
    case '3m':
    case 'trimestral':
      baseDate.setMonth(baseDate.getMonth() + 3 * stepCount);
      break;
    case '6m':
    case 'semestral':
      baseDate.setMonth(baseDate.getMonth() + 6 * stepCount);
      break;
    case '12m':
    case 'anual':
      baseDate.setFullYear(baseDate.getFullYear() + 1 * stepCount);
      break;
    default:
      return dueDate;
  }

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'expense',
    name: 'Mercado Libre',
    amount: 45.0,
    category: 'Compras',
    date: '2026-08-03',
    paymentMethod: 'credit',
    note: 'Artículos de oficina',
    status: 'paid',
  },
  {
    id: 't2',
    type: 'expense',
    name: 'Factura Edesur',
    amount: 120.0,
    category: 'Servicios',
    date: '2026-08-02',
    paymentMethod: 'debit',
    note: 'Servicio de electricidad',
    status: 'paid',
  },
  {
    id: 't3',
    type: 'income',
    name: 'Sueldo Julio',
    amount: 3200.0,
    category: 'Ingresos',
    date: '2026-08-01',
    paymentMethod: 'transfer',
    note: 'Pago mensual',
    status: 'received',
  },
];

const INITIAL_PENDINGS: PendingItem[] = [
  {
    id: 'p1',
    type: 'expense',
    name: 'Alquiler Octubre',
    amount: 1200.0,
    category: 'Hogar',
    dueDate: '2026-07-22', // Vencido hace 12 días
    recurrence: '1m',
    note: 'Alquiler mensual',
  },
  {
    id: 'p2',
    type: 'expense',
    name: 'Luz & Energía',
    amount: 85.5,
    category: 'Servicios',
    dueDate: '2026-08-03', // Vence hoy (0 días)
    recurrence: '1m',
    note: 'Factura Edesur',
  },
  {
    id: 'p3',
    type: 'expense',
    name: 'Internet Fibra',
    amount: 45.0,
    category: 'Servicios',
    dueDate: '2026-08-06', // Vence en 3 días
    recurrence: '1m',
    note: 'Conexión 300Mb',
  },
  {
    id: 'p4',
    type: 'expense',
    name: 'Seguro Auto',
    amount: 210.0,
    category: 'Auto',
    dueDate: '2026-08-28', // Vence en 25 días
    recurrence: '1m',
    note: 'Póliza cobertura completa',
  },
  {
    id: 'p5',
    type: 'expense',
    name: 'Reparación Aire',
    amount: 0, // TBD
    category: 'Otros',
    dueDate: null, // Sin fecha
    recurrence: 'none',
    note: 'Pendiente de presupuesto',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mm_walletBalance');
    return saved ? parseFloat(saved) : 4250.8;
  });

  const [investmentBalance, setInvestmentBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mm_investmentBalance');
    return saved ? parseFloat(saved) : 12400.0;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('mm_categories_v3');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mm_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [pendingItems, setPendingItems] = useState<PendingItem[]>(() => {
    const saved = localStorage.getItem('mm_pendingItems');
    return saved ? JSON.parse(saved) : INITIAL_PENDINGS;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingPendingItem, setEditingPendingItem] = useState<PendingItem | null>(null);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mm_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      name: 'Camilo M.',
      email: 'micro.camilo55@gmail.com',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxb7Tgyu8QlU52A6RD2_N0kl3Owe2U_pkPz8Ekp7-cp1QDiNFs8X4G_ZyumerwS1fDytzJxKat9F2GRPZ6Qmmw2PEWnrHmJsHJy5ExJZxzbZIInUiUBxGBp4dJ2XyL3UacF-J04GgbU7mZ3jKD3U9DIdQS0LVE1XBbacwdcQqlYM_P0t1-7jzulQG_-ORGRvHXR5chWIHcqym2-BQL2my1qzthgqvlmaD5diPMwJUbUQUN76dQAe',
      isLoggedIn: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('mm_user_profile', JSON.stringify(user));
  }, [user]);

  const loginWithGoogle = (email?: string, name?: string, avatarUrl?: string) => {
    setUser({
      name: name || 'Camilo M.',
      email: email || 'micro.camilo55@gmail.com',
      avatarUrl: avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPxb7Tgyu8QlU52A6RD2_N0kl3Owe2U_pkPz8Ekp7-cp1QDiNFs8X4G_ZyumerwS1fDytzJxKat9F2GRPZ6Qmmw2PEWnrHmJsHJy5ExJZxzbZIInUiUBxGBp4dJ2XyL3UacF-J04GgbU7mZ3jKD3U9DIdQS0LVE1XBbacwdcQqlYM_P0t1-7jzulQG_-ORGRvHXR5chWIHcqym2-BQL2my1qzthgqvlmaD5diPMwJUbUQUN76dQAe',
      isLoggedIn: true,
    });
  };

  const logout = () => {
    setUser({
      name: '',
      email: '',
      avatarUrl: '',
      isLoggedIn: false,
    });
  };

  // Sync state to local storage for persistence
  useEffect(() => {
    localStorage.setItem('mm_walletBalance', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('mm_investmentBalance', investmentBalance.toString());
  }, [investmentBalance]);

  useEffect(() => {
    localStorage.setItem('mm_categories_v3', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('mm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mm_pendingItems', JSON.stringify(pendingItems));
  }, [pendingItems]);

  // 1. Initial Setup logic
  const updateBalances = (wallet: number, investment: number) => {
    setWalletBalance(wallet);
    setInvestmentBalance(investment);
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
  };

  const removeCategory = (categoryName: string) => {
    setCategories((prev) => prev.filter((c) => c !== categoryName));
  };

  // 2. Crucial Totals Logic for Transactions
  const applyTotalsLogic = (category: string, amount: number, type: 'income' | 'expense', paymentMethod?: string) => {
    const isInvestment = category.trim() === 'Inversiones' || paymentMethod === 'Inversiones';

    if (isInvestment) {
      setInvestmentBalance((prev) => (type === 'income' ? prev + amount : prev - amount));
    } else {
      setWalletBalance((prev) => (type === 'income' ? prev + amount : prev - amount));
    }
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now(),
    };

    applyTotalsLogic(newTx.category, newTx.amount, newTx.type, newTx.paymentMethod);
    setTransactions((prev) => [newTx, ...prev]);
  };

  // 3. Pendientes logic & transitions
  const addPendingItem = (item: Omit<PendingItem, 'id'>) => {
    const timestamp = Date.now();
    const seriesId = item.recurrence && item.recurrence !== 'none' ? 's_' + timestamp : undefined;
    const newItem: PendingItem = {
      ...item,
      id: 'p_' + timestamp,
      seriesId,
    };

    if (item.recurrence && item.recurrence !== 'none') {
      const futureItems: PendingItem[] = [newItem];
      // Generate 12 future cycles so it appears in all upcoming months
      for (let i = 1; i <= 12; i++) {
        const nextDueDate = calculateNextDueDate(item.dueDate, item.recurrence, i);
        futureItems.push({
          ...item,
          id: `p_${timestamp}_${i}`,
          dueDate: nextDueDate,
          seriesId,
        });
      }
      setPendingItems((prev) => [...prev, ...futureItems]);
    } else {
      setPendingItems((prev) => [...prev, newItem]);
    }
  };

  const updatePendingItem = (updated: PendingItem) => {
    setPendingItems((prev) => {
      const target = prev.find((p) => p.id === updated.id);
      if (!target) return prev;

      const isRecurring =
        (target.seriesId && target.seriesId.length > 0) ||
        (target.recurrence && target.recurrence !== 'none') ||
        (updated.recurrence && updated.recurrence !== 'none');

      if (!isRecurring) {
        return prev.map((item) => (item.id === updated.id ? updated : item));
      }

      const seriesId = target.seriesId || 's_' + Date.now();
      const updatedWithSeries = { ...updated, seriesId };

      const isMatchingFuture = (p: PendingItem) => {
        if (p.id === target.id) return false;
        const sameSeries =
          (target.seriesId && p.seriesId && p.seriesId === target.seriesId) ||
          (p.name === target.name && p.category === target.category && p.type === target.type);

        if (!sameSeries) return false;

        if (target.dueDate && p.dueDate) {
          return p.dueDate >= target.dueDate;
        }
        return true;
      };

      if (!updated.recurrence || updated.recurrence === 'none') {
        return prev
          .filter((p) => !isMatchingFuture(p))
          .map((p) => (p.id === updated.id ? { ...updated, seriesId: undefined } : p));
      }

      const remaining = prev.filter((p) => p.id !== target.id && !isMatchingFuture(p));
      const futureItems: PendingItem[] = [];
      const timestamp = Date.now();
      for (let i = 1; i <= 12; i++) {
        const nextDueDate = calculateNextDueDate(updated.dueDate, updated.recurrence, i);
        futureItems.push({
          ...updatedWithSeries,
          id: `p_${timestamp}_${i}`,
          dueDate: nextDueDate,
        });
      }

      return [...remaining, updatedWithSeries, ...futureItems];
    });
  };

  const deletePendingItem = (id: string) => {
    setPendingItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev.filter((p) => p.id !== id);

      const isRecurring =
        (target.seriesId && target.seriesId.length > 0) ||
        (target.recurrence && target.recurrence !== 'none');

      if (!isRecurring) {
        return prev.filter((p) => p.id !== id);
      }

      const isMatchingCurrentOrFuture = (p: PendingItem) => {
        if (p.id === target.id) return true;
        const sameSeries =
          (target.seriesId && p.seriesId && p.seriesId === target.seriesId) ||
          (p.name === target.name && p.category === target.category && p.type === target.type);

        if (!sameSeries) return false;

        if (target.dueDate && p.dueDate) {
          return p.dueDate >= target.dueDate;
        }
        return true;
      };

      return prev.filter((p) => !isMatchingCurrentOrFuture(p));
    });
  };

  const markPendingAsPaid = (id: string, customAmount?: number) => {
    const itemToPay = pendingItems.find((p) => p.id === id);
    if (!itemToPay) return;

    const paidAmount =
      customAmount !== undefined && !isNaN(customAmount) ? customAmount : itemToPay.amount;

    // Remove from pendingItems, and if recurring, create next entry if not existing
    setPendingItems((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (itemToPay.recurrence && itemToPay.recurrence !== 'none') {
        const nextDueDate = calculateNextDueDate(itemToPay.dueDate, itemToPay.recurrence);
        const exists = filtered.some(
          (p) => p.name === itemToPay.name && p.category === itemToPay.category && p.dueDate === nextDueDate
        );
        if (!exists) {
          const recurringItem: PendingItem = {
            ...itemToPay,
            id: 'p_' + Date.now(),
            dueDate: nextDueDate,
          };
          return [...filtered, recurringItem];
        }
      }
      return filtered;
    });

    const todayDate = new Date().toISOString().split('T')[0];

    // Trigger Totals Logic instantly
    applyTotalsLogic(itemToPay.category, paidAmount, itemToPay.type);

    // Insert into transactions array
    const newTx: Transaction = {
      id: 'tx_paid_' + Date.now(),
      type: itemToPay.type,
      name: itemToPay.name,
      amount: paidAmount,
      category: itemToPay.category,
      date: todayDate,
      paymentMethod: 'Efectivo',
      note: itemToPay.note || 'Pendiente completado',
      status: itemToPay.type === 'income' ? 'received' : 'paid',
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  // 4. Transfer money between balances
  const transferFunds = (amount: number, direction: 'walletToInv' | 'invToWallet'): boolean => {
    if (amount <= 0) return false;

    if (direction === 'walletToInv') {
      if (walletBalance < amount) return false;
      setWalletBalance((prev) => prev - amount);
      setInvestmentBalance((prev) => prev + amount);
    } else {
      if (investmentBalance < amount) return false;
      setInvestmentBalance((prev) => prev - amount);
      setWalletBalance((prev) => prev + amount);
    }

    // Optionally log transfer as transaction
    const todayDate = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: 'tx_transfer_' + Date.now(),
      type: direction === 'walletToInv' ? 'expense' : 'income',
      name: direction === 'walletToInv' ? 'Transferencia a Inversiones' : 'Retiro de Inversiones',
      amount: amount,
      category: 'Inversiones',
      date: todayDate,
      paymentMethod: 'transfer',
      note: direction === 'walletToInv' ? 'Movimiento Billetera -> Inversiones' : 'Movimiento Inversiones -> Billetera',
      status: 'paid',
    };
    setTransactions((prev) => [newTx, ...prev]);

    return true;
  };

  return (
    <AppContext.Provider
      value={{
        walletBalance,
        investmentBalance,
        categories,
        transactions,
        pendingItems,
        currentView,
        isTransferModalOpen,
        editingPendingItem,
        user,
        setCurrentView,
        setIsTransferModalOpen,
        setEditingPendingItem,
        updateBalances,
        addCategory,
        removeCategory,
        addTransaction,
        addPendingItem,
        updatePendingItem,
        deletePendingItem,
        markPendingAsPaid,
        transferFunds,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
