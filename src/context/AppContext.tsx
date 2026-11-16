import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Transaction, PendingItem, PendingEditScope, ViewMode, UserProfile } from '../types';
import { supabase } from '../utils/supabase';
import { DEFAULT_CATEGORY_NAMES } from '../utils/categories';
import { todayString } from '../utils/dates';

const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_NAMES;

export const CREDIT_CARD_METHOD = 'Tarjeta de Crédito';
export const TRANSFER_METHOD = 'transfer';
const CREDIT_PAYMENT_NAME = 'Pago Tarjeta de Crédito';

// Cambio en cada saldo. `credit` es el cambio en la deuda de la tarjeta (positivo = más deuda).
interface BalanceDelta {
  wallet: number;
  investment: number;
  credit: number;
}

export const isCreditCardPayment = (tx: Pick<Transaction, 'name' | 'category' | 'type'>) =>
  tx.type === 'expense' && tx.name === CREDIT_PAYMENT_NAME && tx.category === 'Deuda';

// Transferencias y pagos de tarjeta mueven dinero entre dos saldos; se generan desde
// sus propios modales, así que al editarlos solo se permite cambiar monto, fecha y nota.
export const isSystemTransaction = (tx: Transaction) =>
  tx.paymentMethod === TRANSFER_METHOD || isCreditCardPayment(tx);

// Gasto que se paga con la tarjeta (Inversiones siempre sale de Inversiones)
export const isCreditCardExpense = (item: Pick<Transaction, 'type' | 'category' | 'paymentMethod'>) =>
  item.type === 'expense' && item.paymentMethod === CREDIT_CARD_METHOD && item.category.trim() !== 'Inversiones';

// Efecto que tiene un movimiento sobre los saldos. Se usa para aplicarlo al crearlo
// y para revertirlo al editarlo o eliminarlo.
const getBalanceEffect = (tx: Omit<Transaction, 'id'>): BalanceDelta => {
  const { amount, type, category, paymentMethod } = tx;
  const sign = type === 'income' ? 1 : -1;

  if (paymentMethod === TRANSFER_METHOD) {
    // Gasto = Billetera -> Inversiones, Ingreso = Inversiones -> Billetera
    return { wallet: sign * amount, investment: -sign * amount, credit: 0 };
  }
  if (isCreditCardPayment(tx)) {
    return { wallet: -amount, investment: 0, credit: -amount };
  }
  if (paymentMethod === CREDIT_CARD_METHOD) {
    // Un gasto con tarjeta no toca la Billetera, solo aumenta la deuda
    return { wallet: 0, investment: 0, credit: -sign * amount };
  }
  if (category.trim() === 'Inversiones' || paymentMethod === 'Inversiones') {
    return { wallet: 0, investment: sign * amount, credit: 0 };
  }
  return { wallet: sign * amount, investment: 0, credit: 0 };
};

const sortTransactions = (items: Transaction[]): Transaction[] =>
  [...items].sort((a, b) => b.date.localeCompare(a.date));

interface AppContextType {
  walletBalance: number;
  investmentBalance: number;
  creditCardBalance: number;
  creditLimit: number;
  categories: string[];
  transactions: Transaction[];
  pendingItems: PendingItem[];
  currentView: ViewMode;
  isTransferModalOpen: boolean;
  isPayCreditModalOpen: boolean;
  editingPendingItem: PendingItem | null;
  editingTransaction: Transaction | null;
  user: UserProfile;
  setCurrentView: (view: ViewMode) => void;
  goBack: (fallback: ViewMode) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setIsPayCreditModalOpen: (open: boolean) => void;
  setEditingPendingItem: (item: PendingItem | null) => void;
  setEditingTransaction: (tx: Transaction | null) => void;
  updateBalances: (wallet: number, investment: number, creditLimit?: number, creditBalance?: number) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPendingItem: (item: Omit<PendingItem, 'id'>) => void;
  updatePendingItem: (item: PendingItem, scope?: PendingEditScope) => Promise<void>;
  deletePendingItem: (id: string, deleteAllSeries?: boolean) => void;
  markPendingAsPaid: (
    id: string,
    customAmount?: number,
    account?: string,
    card?: { installments: number; interestRate: number }
  ) => void;
  transferFunds: (amount: number, direction: 'walletToInv' | 'invToWallet') => Promise<boolean>;
  payCreditCard: (amount: number) => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string; confirmationSent?: boolean }>;
  updateProfile: (name: string, avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  budgets: Record<string, number>; // presupuesto mensual por categoría
  budgetsAvailable: boolean; // false si la tabla budgets aún no existe en la base
  setBudget: (category: string, amount: number | null) => Promise<void>;
}




// Vistas que se pueden abrir directamente desde el hash de la URL (ej. atajos de la PWA)
const DEEP_LINK_VIEWS: ViewMode[] = [
  'dashboard',
  'pendientes',
  'tarjeta',
  'estadisticas',
  'new-transaction',
  'new-pending',
  'setup',
];

// Cantidad de ocurrencias futuras (desde hoy) que se mantienen siempre generadas por serie
const RECURRENCE_HORIZON = 12;

const MONTHS_PER_RECURRENCE: Record<string, number> = {
  '1m': 1,
  mensual: 1,
  '2m': 2,
  bimensual: 2,
  '3m': 3,
  trimestral: 3,
  '6m': 6,
  semestral: 6,
  '12m': 12,
  anual: 12,
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateNextDueDate = (
  dueDate: string | null,
  recurrence: string,
  stepCount: number = 1
): string | null => {
  if (!recurrence || recurrence === 'none') return dueDate;

  const baseDate = dueDate ? new Date(dueDate + 'T00:00:00') : new Date();

  if (recurrence === '1w' || recurrence === 'semanal') {
    baseDate.setDate(baseDate.getDate() + 7 * stepCount);
    return formatLocalDate(baseDate);
  }

  const months = MONTHS_PER_RECURRENCE[recurrence];
  if (!months) return dueDate;

  // Mismo día del mes (15 ene -> 15 feb -> 15 mar). Si el mes destino no tiene ese día,
  // se usa su último día (31 ene -> 28 feb) en lugar de desbordar al mes siguiente.
  const originalDay = baseDate.getDate();
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth() + months * stepCount, 1);
  const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(originalDay, lastDayOfMonth));
  return formatLocalDate(target);
};

// Revisa las series recurrentes del usuario y agrega ocurrencias al final de cada una
// para que siempre existan RECURRENCE_HORIZON ocurrencias con fecha desde hoy en adelante.
const replenishRecurringSeries = async (userId: string) => {
  const { data, error } = await supabase
    .from('pending_items')
    .select('*')
    .eq('user_id', userId)
    .not('series_id', 'is', null);

  if (error || !data) {
    if (error) console.error('Error leyendo series recurrentes:', error);
    return;
  }

  const today = formatLocalDate(new Date());
  const seriesMap = new Map<string, any[]>();
  for (const row of data) {
    if (!row.due_date || !row.recurrence || row.recurrence === 'none') continue;
    const rows = seriesMap.get(row.series_id) || [];
    rows.push(row);
    seriesMap.set(row.series_id, rows);
  }

  const rowsToInsert: any[] = [];
  for (const rows of seriesMap.values()) {
    let missing = RECURRENCE_HORIZON - rows.filter((r) => r.due_date >= today).length;
    if (missing <= 0) continue;

    const last = rows.reduce((a, b) => (b.due_date > a.due_date ? b : a));
    // Se toma como ancla la ocurrencia con el día del mes más alto, para no arrastrar
    // un día recortado (ej. 28 feb en una serie del 31) al resto de la serie.
    const anchor = rows.reduce((a, b) =>
      Number(b.due_date.slice(8, 10)) > Number(a.due_date.slice(8, 10)) ? b : a
    );

    for (let i = 1; missing > 0 && i <= 1000; i++) {
      const nextDueDate = calculateNextDueDate(anchor.due_date, last.recurrence, i);
      if (!nextDueDate || nextDueDate <= last.due_date) continue;
      rowsToInsert.push({
        user_id: userId,
        type: last.type,
        name: last.name,
        amount: last.amount,
        category: last.category,
        due_date: nextDueDate,
        recurrence: last.recurrence,
        note: last.note,
        series_id: last.series_id,
        payment_method: last.payment_method,
        installments: last.installments,
        interest_rate: last.interest_rate,
        is_automatic: last.is_automatic,
      });
      if (nextDueDate >= today) missing--;
    }
  }

  if (rowsToInsert.length === 0) return;
  const { error: insertError } = await supabase.from('pending_items').insert(rowsToInsert);
  if (insertError) console.error('Error reponiendo series recurrentes:', insertError);
};

// Columnas editables de un pendiente en la tabla pending_items
const toPendingRow = (item: Omit<PendingItem, 'id'>) => ({
  type: item.type,
  name: item.name,
  amount: item.amount,
  category: item.category,
  due_date: item.dueDate,
  recurrence: item.recurrence,
  note: item.note,
  payment_method: item.paymentMethod ?? null,
  installments: item.installments ?? null,
  interest_rate: item.interestRate ?? null,
  is_automatic: item.isAutomatic ?? false,
});

// Columnas de un movimiento en la tabla transactions
const toTransactionRow = (tx: Omit<Transaction, 'id'>) => ({
  type: tx.type,
  name: tx.name,
  amount: tx.amount,
  category: tx.category,
  date: tx.date,
  payment_method: tx.paymentMethod,
  note: tx.note,
  status: tx.status,
  installments: tx.installments ?? null,
  interest_rate: tx.interestRate ?? null,
});

const fromTransactionRow = (t: any): Transaction => ({
  id: t.id,
  type: t.type,
  name: t.name,
  amount: Number(t.amount),
  category: t.category,
  date: t.date,
  paymentMethod: t.payment_method,
  note: t.note,
  status: t.status,
  installments: t.installments ?? undefined,
  interestRate: t.interest_rate != null ? Number(t.interest_rate) : undefined,
});

export const sortPendingItems =(items: PendingItem[]): PendingItem[] => {
  return [...items].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [investmentBalance, setInvestmentBalance] = useState<number>(0);
  const [creditCardBalance, setCreditCardBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // Saldos más recientes. Las funciones del contexto pueden quedar guardadas en closures
  // (un "Deshacer", dos operaciones seguidas antes del siguiente render), así que leen de
  // aquí y no del estado de su render, que podría estar desactualizado.
  const balancesRef = useRef<BalanceDelta>({ wallet: 0, investment: 0, credit: 0 });
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [budgetsAvailable, setBudgetsAvailable] = useState(false);
  const pendingBalanceOps = useRef(0);
  const balanceRpcAvailable = useRef(true);

  const commitBalances = (next: Partial<BalanceDelta>) => {
    balancesRef.current = { ...balancesRef.current, ...next };
    if (next.wallet !== undefined) setWalletBalance(next.wallet);
    if (next.investment !== undefined) setInvestmentBalance(next.investment);
    if (next.credit !== undefined) setCreditCardBalance(next.credit);
  };

  // Si había una sesión guardada se arranca directo en el panel (o en la vista del hash de la
  // URL, ej. /#pendientes); si al verificarla resulta que ya no es válida, fetchSession devuelve al login.
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mm_user_profile') || '{}');
      if (!saved.isLoggedIn) return 'login';
      const fromHash = window.location.hash.slice(1) as ViewMode;
      return DEEP_LINK_VIEWS.includes(fromHash) ? fromHash : 'dashboard';
    } catch {
      return 'login';
    }
  });

  // Cada cambio de vista queda en el historial del navegador para que "atrás" funcione.
  // `depth` cuenta las entradas propias de la app, para saber si hay a dónde volver.
  // El login reemplaza la entrada actual para que "atrás" no regrese a una vista privada.
  const isPoppingHistory = useRef(false);
  useEffect(() => {
    if (isPoppingHistory.current) {
      isPoppingHistory.current = false;
      return;
    }
    const state = window.history.state;
    if (state?.view === currentView) return;
    const url = `${window.location.pathname}${window.location.search}#${currentView}`;
    if (!state?.view || currentView === 'login') {
      window.history.replaceState({ view: currentView, depth: 0 }, '', url);
    } else {
      window.history.pushState({ view: currentView, depth: (state.depth ?? 0) + 1 }, '', url);
    }
  }, [currentView]);

  // Vuelve a la vista anterior; si se entró directo (sin historial propio), va a `fallback`
  const goBack = (fallback: ViewMode) => {
    if ((window.history.state?.depth ?? 0) > 0) window.history.back();
    else setCurrentView(fallback);
  };

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const view = event.state?.view as ViewMode | undefined;
      if (!view) return;
      // Sin sesión no se puede volver a una vista privada
      if (!isLoggedInRef.current && view !== 'login') {
        window.history.pushState({ view: 'login', depth: 0 }, '', `${window.location.pathname}#login`);
        return;
      }
      isPoppingHistory.current = true;
      setCurrentView(view);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPayCreditModalOpen, setIsPayCreditModalOpen] = useState(false);
  const [editingPendingItem, setEditingPendingItem] = useState<PendingItem | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const replenishPromise = useRef<Promise<void> | null>(null);
  const isLoggedInRef = useRef(false);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mm_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.isLoggedIn) return parsed;
      } catch (e) { /* fallback */ }
    }
    return {
      name: '',
      email: '',
      avatarUrl: '',
      isLoggedIn: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('mm_user_profile', JSON.stringify(user));
    isLoggedInRef.current = user.isLoggedIn;
  }, [user]);

  // Sync Supabase Auth session & user data on load & auth state change
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Mostrar el panel de una vez, sin esperar a que terminen de cargar los datos
        setCurrentView((view) => (view === 'login' ? 'dashboard' : view));
        await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        await loadUserData(session.user.id);
      } else {
        setUser({ name: '', email: '', avatarUrl: '', isLoggedIn: false });
        setCurrentView('login');
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser({ name: '', email: '', avatarUrl: '', isLoggedIn: false });
        setTransactions([]);
        setPendingItems([]);
        commitBalances({ wallet: 0, investment: 0, credit: 0 });
        setCreditLimit(0);
        setBudgets({});
        setCurrentView('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // 1. Fetch Wallets
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletData) {
        commitBalances({
          wallet: Number(walletData.wallet_balance) || 0,
          investment: Number(walletData.investment_balance) || 0,
          credit: Number(walletData.credit_balance) || 0,
        });
        setCreditLimit(Number(walletData.credit_limit) || 0);
      } else {
        await supabase.from('wallets').upsert(
          { user_id: userId, wallet_balance: 0, investment_balance: 0, credit_balance: 0, credit_limit: 0 },
          { onConflict: 'user_id' }
        );
        commitBalances({ wallet: 0, investment: 0, credit: 0 });
        setCreditLimit(0);
      }

      // 2. Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txData) {
        setTransactions(txData.map(fromTransactionRow));
      } else {
        setTransactions([]);
      }

      // 3. Fetch Pending Items (reponiendo antes las series recurrentes).
      // Se comparte la misma promesa entre cargas simultáneas para no insertar duplicados.
      if (!replenishPromise.current) {
        replenishPromise.current = replenishRecurringSeries(userId).finally(() => {
          replenishPromise.current = null;
        });
      }
      await replenishPromise.current;

      const { data: pendData } = await supabase
        .from('pending_items')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (pendData) {
        setPendingItems(
          sortPendingItems(
            pendData.map((p: any) => ({
              id: p.id,
              type: p.type,
              name: p.name,
              amount: Number(p.amount),
              category: p.category,
              dueDate: p.due_date,
              recurrence: p.recurrence,
              note: p.note,
              seriesId: p.series_id,
              paymentMethod: p.payment_method ?? undefined,
              installments: p.installments ?? undefined,
              interestRate: p.interest_rate != null ? Number(p.interest_rate) : undefined,
              isAutomatic: !!p.is_automatic,
            }))
          )
        );
      } else {
        setPendingItems([]);
      }

      // 4. Fetch User Settings & Custom Categories
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('categories')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: customCatRows } = await supabase
        .from('categories')
        .select('name')
        .or(`user_id.is.null,user_id.eq.${userId}`);

      let userSavedCats: string[] = [];
      if (settingsData?.categories && Array.isArray(settingsData.categories)) {
        userSavedCats = settingsData.categories;
      }
      if (customCatRows && customCatRows.length > 0) {
        const catNames = customCatRows.map((r: any) => r.name);
        userSavedCats = Array.from(new Set([...userSavedCats, ...catNames]));
      }

      // ALWAYS merge DEFAULT_CATEGORIES with userSavedCats so default categories are NEVER lost!
      const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...userSavedCats]));

      setCategories(mergedCategories);

      // 5. Presupuestos (tabla opcional: supabase/migrations/..._budgets.sql)
      const { data: budgetRows, error: budgetsError } = await supabase
        .from('budgets')
        .select('category, amount')
        .eq('user_id', userId);
      if (budgetsError) {
        setBudgetsAvailable(false);
        // 42P01 / PGRST205: la tabla no existe todavía
        if (budgetsError.code !== '42P01' && budgetsError.code !== 'PGRST205') {
          console.error('Error cargando presupuestos:', budgetsError);
        }
      } else {
        setBudgetsAvailable(true);
        setBudgets(Object.fromEntries((budgetRows ?? []).map((b: any) => [b.category, Number(b.amount)])));
      }
    } catch (err) {
      console.error('Error al cargar datos de Supabase:', err);
    }
  };

  const loadUserProfile = async (userId: string, email: string, metadata?: any) => {
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || userId)}`;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          name: profile.name || metadata?.full_name || metadata?.name || email.split('@')[0],
          email: profile.email || email,
          avatarUrl: profile.avatar_url || metadata?.avatar_url || defaultAvatar,
          isLoggedIn: true,
        });
      } else {
        setUser({
          name: metadata?.full_name || metadata?.name || email.split('@')[0] || 'Usuario',
          email: email,
          avatarUrl: metadata?.avatar_url || defaultAvatar,
          isLoggedIn: true,
        });
      }
    } catch (err) {
      setUser({
        name: metadata?.full_name || metadata?.name || email.split('@')[0] || 'Usuario',
        email: email,
        avatarUrl: metadata?.avatar_url || defaultAvatar,
        isLoggedIn: true,
      });
    }
  };

  const translateAuthError = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'Correo electrónico o contraseña incorrectos.';
    if (msg.includes('User already registered')) return 'Este correo ya está registrado en la plataforma.';
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('Email not confirmed')) return 'Por favor confirma tu correo electrónico antes de ingresar.';
    return msg;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      if (data.user && data.session) {
        await loadUserProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al conectar con el servidor.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    avatarUrl?: string
  ): Promise<{ success: boolean; error?: string; confirmationSent?: boolean }> => {
    try {
      const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
      const metadataAvatar = finalAvatar.length > 2000
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`
        : finalAvatar;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
            avatar_url: metadataAvatar,
          },
        },
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.trim(),
          name: name.trim(),
          avatar_url: finalAvatar,
          updated_at: new Date().toISOString(),
        });

        // Sign in immediately to establish authenticated session for DB operations
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInData?.session?.user) {
          await loadUserProfile(signInData.session.user.id, email.trim(), signInData.session.user.user_metadata);
          await loadUserData(signInData.session.user.id);
        } else if (data.session?.user) {
          await loadUserProfile(data.session.user.id, email.trim(), data.session.user.user_metadata);
          await loadUserData(data.session.user.id);
        }

        return { success: true, confirmationSent: false };
      }

      return { success: false, error: 'No se pudo crear la cuenta.' };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err.message || 'Error al registrar la cuenta.') };
    }
  };

  const updateProfile = async (name: string, avatarUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          name: name.trim(),
          avatar_url: avatarUrl.trim(),
          updated_at: new Date().toISOString(),
        });

        await supabase.auth.updateUser({
          data: { full_name: name.trim(), avatar_url: avatarUrl.trim() }
        });
      }

      setUser((prev) => ({
        ...prev,
        name: name.trim() || prev.name,
        avatarUrl: avatarUrl.trim() || prev.avatarUrl,
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      /* ignore */
    }
    setUser({
      name: '',
      email: '',
      avatarUrl: '',
      isLoggedIn: false,
    });
  };



  const getActiveUserId = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) return currentUser.id;
    } catch (e) {
      /* ignore */
    }
    return null;
  };

  // 1. Initial Setup logic
  const updateBalances = async (
    wallet: number,
    investment: number,
    newCreditLimit: number = creditLimit,
    newCreditBalance: number = balancesRef.current.credit
  ) => {
    commitBalances({ wallet, investment, credit: newCreditBalance });
    setCreditLimit(newCreditLimit);

    const userId = await getActiveUserId();
    if (userId) {
      const { error } = await supabase.from('wallets').upsert(
        {
          user_id: userId,
          wallet_balance: wallet,
          investment_balance: investment,
          credit_limit: newCreditLimit,
          credit_balance: newCreditBalance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) console.error('Error actualizando saldos en Supabase:', error);
    }
  };

  // amount null o <= 0 elimina el presupuesto de la categoría
  const setBudget = async (category: string, amount: number | null) => {
    const remove = amount === null || amount <= 0;
    setBudgets((prev) => {
      const next = { ...prev };
      if (remove) delete next[category];
      else next[category] = amount;
      return next;
    });

    const userId = await getActiveUserId();
    if (!userId) return;
    const { error } = remove
      ? await supabase.from('budgets').delete().eq('user_id', userId).eq('category', category)
      : await supabase
          .from('budgets')
          .upsert(
            { user_id: userId, category, amount, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,category' }
          );
    if (error) console.error('Error guardando presupuesto:', error);
  };

  const addCategory = async (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);

      const userId = await getActiveUserId();
      if (userId) {
        // 1. Save array to user_settings
        await supabase.from('user_settings').upsert(
          {
            user_id: userId,
            categories: updated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        // 2. Insert row into categories table
        await supabase.from('categories').insert({
          user_id: userId,
          name: trimmed,
        });
      }
    }
  };

  const removeCategory = async (categoryName: string) => {
    const updated = categories.filter((c) => c !== categoryName);
    setCategories(updated);

    const userId = await getActiveUserId();
    if (userId) {
      // 1. Update user_settings array
      await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          categories: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      // 2. Delete row from categories table
      await supabase.from('categories').delete().eq('user_id', userId).eq('name', categoryName);
    }
  };

  // 2. Crucial Totals Logic for Transactions
  // El cambio se aplica de inmediato en pantalla y en la base se suma de forma atómica con la
  // función apply_balance_delta (supabase/migrations). Su respuesta trae los saldos reales,
  // que se adoptan cuando no queda otra operación en curso (para no deshacer una que aún no
  // ha respondido). Si la función todavía no existe en la base, se escribe el total como antes.
  const applyBalanceDelta = async (delta: BalanceDelta) => {
    if (delta.wallet === 0 && delta.investment === 0 && delta.credit === 0) return;

    const current = balancesRef.current;
    commitBalances({
      wallet: current.wallet + delta.wallet,
      investment: current.investment + delta.investment,
      credit: current.credit + delta.credit,
    });

    const userId = await getActiveUserId();
    if (!userId) return;

    if (balanceRpcAvailable.current) {
      pendingBalanceOps.current++;
      const { data, error } = await supabase.rpc('apply_balance_delta', {
        p_wallet: delta.wallet,
        p_investment: delta.investment,
        p_credit: delta.credit,
      });
      pendingBalanceOps.current--;

      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && pendingBalanceOps.current === 0) {
          commitBalances({
            wallet: Number(row.wallet_balance) || 0,
            investment: Number(row.investment_balance) || 0,
            credit: Number(row.credit_balance) || 0,
          });
        }
        return;
      }
      // PGRST202: la función no existe (la migración aún no se ha aplicado)
      if (error.code !== 'PGRST202') {
        console.error('Error ajustando saldos en Supabase:', error);
        return;
      }
      balanceRpcAvailable.current = false;
    }

    const latest = balancesRef.current;
    const { error } = await supabase.from('wallets').upsert(
      {
        user_id: userId,
        wallet_balance: latest.wallet,
        investment_balance: latest.investment,
        credit_balance: latest.credit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) console.error('Error actualizando saldos en Supabase:', error);
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const userId = await getActiveUserId();

    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now(),
    };

    await applyBalanceDelta(getBalanceEffect(newTx));
    setTransactions((prev) => sortTransactions([newTx, ...prev]));

    if (userId) {
      const { data, error } = await supabase.from('transactions').insert({
        user_id: userId,
        ...toTransactionRow(tx),
      }).select();

      if (error) {
        console.error('Error insertando transacción en Supabase:', error);
      } else if (data && data[0]) {
        const savedTx = fromTransactionRow(data[0]);
        setTransactions((prev) => sortTransactions([savedTx, ...prev.filter((t) => t.id !== newTx.id)]));
      }
    }
  };

  // Al editar se revierte el efecto del movimiento original y se aplica el del nuevo
  const updateTransaction = async (updated: Transaction) => {
    const original = transactions.find((t) => t.id === updated.id);
    if (!original) return;

    const before = getBalanceEffect(original);
    const after = getBalanceEffect(updated);
    await applyBalanceDelta({
      wallet: after.wallet - before.wallet,
      investment: after.investment - before.investment,
      credit: after.credit - before.credit,
    });
    setTransactions((prev) => sortTransactions(prev.map((t) => (t.id === updated.id ? updated : t))));

    const userId = await getActiveUserId();
    if (userId) {
      const { error } = await supabase
        .from('transactions')
        .update(toTransactionRow(updated))
        .eq('id', updated.id)
        .eq('user_id', userId);
      if (error) console.error('Error actualizando transacción en Supabase:', error);
    }
  };

  // Al eliminar se revierte el efecto del movimiento en los saldos
  const deleteTransaction = async (id: string) => {
    const original = transactions.find((t) => t.id === id);
    if (!original) return;

    const effect = getBalanceEffect(original);
    await applyBalanceDelta({
      wallet: -effect.wallet,
      investment: -effect.investment,
      credit: -effect.credit,
    });
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const userId = await getActiveUserId();
    if (userId) {
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
      if (error) console.error('Error eliminando transacción en Supabase:', error);
    }
  };

  // 3. Pendientes logic & transitions
  const addPendingItem = async (item: Omit<PendingItem, 'id'>) => {
    const userId = await getActiveUserId();

    const timestamp = Date.now();
    const seriesId = item.recurrence && item.recurrence !== 'none' ? 's_' + timestamp : undefined;
    const newItem: PendingItem = {
      ...item,
      id: 'p_' + timestamp,
      seriesId,
    };

    let itemsToAdd: PendingItem[] = [];

    if (item.recurrence && item.recurrence !== 'none') {
      itemsToAdd.push(newItem);
      for (let i = 1; i <= 12; i++) {
        const nextDueDate = calculateNextDueDate(item.dueDate, item.recurrence, i);
        itemsToAdd.push({
          ...item,
          id: `p_${timestamp}_${i}`,
          dueDate: nextDueDate,
          seriesId,
        });
      }
    } else {
      itemsToAdd.push(newItem);
    }

    setPendingItems((prev) => sortPendingItems([...prev, ...itemsToAdd]));

    if (userId) {
      const dbRows = itemsToAdd.map((it) => ({
        user_id: userId,
        ...toPendingRow(it),
        series_id: it.seriesId,
      }));
      const { error } = await supabase.from('pending_items').insert(dbRows);
      if (error) {
        console.error('Error insertando pendientes en Supabase:', error);
      } else {
        await loadUserData(userId);
      }
    }
  };

  // scope 'single' cambia solo esta ocurrencia; 'series' aplica los cambios a toda la serie.
  // Si en la serie cambia la fecha o la repetición, se regeneran esta ocurrencia y las siguientes.
  const updatePendingItem = async (updated: PendingItem, scope: PendingEditScope = 'series') => {
    const userId = await getActiveUserId();
    const target = pendingItems.find((p) => p.id === updated.id);
    if (!target) return;

    const isRecurrence = (r?: string) => !!r && r !== 'none';
    const wasRecurring = !!target.seriesId || isRecurrence(target.recurrence);
    const willRecur = isRecurrence(updated.recurrence);

    // 1. Un solo registro: pendiente sin repetición, o el usuario eligió editar solo este
    if (scope === 'single' || (!wasRecurring && !willRecur)) {
      setPendingItems((prev) => sortPendingItems(prev.map((p) => (p.id === updated.id ? updated : p))));

      if (userId) {
        const { error } = await supabase
          .from('pending_items')
          .update(toPendingRow(updated))
          .eq('id', updated.id)
          .eq('user_id', userId);

        if (error) {
          console.error('Error actualizando pendiente en Supabase:', error);
        } else {
          await loadUserData(userId);
        }
      }
      return;
    }

    // Campos que comparten todas las ocurrencias de la serie (todo menos la fecha)
    const { due_date: _dueDate, ...sharedRow } = toPendingRow(updated);
    const withSharedFields = (p: PendingItem): PendingItem => ({
      ...p,
      type: updated.type,
      name: updated.name,
      amount: updated.amount,
      category: updated.category,
      recurrence: updated.recurrence,
      note: updated.note,
      paymentMethod: updated.paymentMethod,
      installments: updated.installments,
      interestRate: updated.interestRate,
    });

    // 2. Toda la serie con el mismo calendario: se actualizan los datos y cada ocurrencia conserva su fecha
    const scheduleChanged =
      !target.seriesId || updated.dueDate !== target.dueDate || updated.recurrence !== target.recurrence;

    if (!scheduleChanged) {
      setPendingItems((prev) =>
        sortPendingItems(
          prev.map((p) =>
            p.id === updated.id ? updated : p.seriesId === target.seriesId ? withSharedFields(p) : p
          )
        )
      );

      if (userId) {
        const { error: seriesError } = await supabase
          .from('pending_items')
          .update(sharedRow)
          .eq('user_id', userId)
          .eq('series_id', target.seriesId);
        const { error } = await supabase
          .from('pending_items')
          .update(toPendingRow(updated))
          .eq('id', updated.id)
          .eq('user_id', userId);

        if (seriesError || error) {
          console.error('Error actualizando serie de pendientes en Supabase:', seriesError || error);
        } else {
          await loadUserData(userId);
        }
      }
      return;
    }

    // 3. Toda la serie con un calendario nuevo: se regeneran esta ocurrencia y las siguientes,
    // y a las anteriores (vencidas) se les aplican los mismos datos.
    const seriesId = target.seriesId || 's_' + Date.now();
    const updatedWithSeries = { ...updated, seriesId: willRecur ? seriesId : undefined };

    setPendingItems((prev) => {
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

      const remaining = prev
        .filter((p) => p.id !== target.id && !isMatchingFuture(p))
        .map((p) =>
          target.seriesId && p.seriesId === target.seriesId
            ? { ...withSharedFields(p), seriesId: willRecur ? p.seriesId : undefined }
            : p
        );

      const futureItems: PendingItem[] = [];
      if (willRecur) {
        const timestamp = Date.now();
        for (let i = 1; i <= 12; i++) {
          futureItems.push({
            ...updatedWithSeries,
            id: `p_${timestamp}_${i}`,
            dueDate: calculateNextDueDate(updated.dueDate, updated.recurrence!, i),
          });
        }
      }

      return sortPendingItems([...remaining, updatedWithSeries, ...futureItems]);
    });

    if (userId) {
      if (target.seriesId) {
        let deleteQuery = supabase
          .from('pending_items')
          .delete()
          .eq('user_id', userId)
          .eq('series_id', target.seriesId);
        if (target.dueDate) deleteQuery = deleteQuery.gte('due_date', target.dueDate);
        await deleteQuery;
      } else {
        await supabase.from('pending_items').delete().eq('user_id', userId).eq('id', updated.id);
      }

      const itemsToInsert: Omit<PendingItem, 'id'>[] = [updatedWithSeries];
      if (willRecur) {
        for (let i = 1; i <= 12; i++) {
          itemsToInsert.push({
            ...updatedWithSeries,
            dueDate: calculateNextDueDate(updated.dueDate, updated.recurrence!, i),
          });
        }
      }

      const dbRows = itemsToInsert.map((it) => ({
        user_id: userId,
        ...toPendingRow(it),
        series_id: it.seriesId ?? null,
      }));

      const { error } = await supabase.from('pending_items').insert(dbRows);

      // Ocurrencias anteriores que quedaron en la serie. Si la serie deja de repetirse, se desvinculan.
      let previousError = null;
      if (target.seriesId) {
        ({ error: previousError } = await supabase
          .from('pending_items')
          .update(willRecur ? sharedRow : { ...sharedRow, series_id: null })
          .eq('user_id', userId)
          .eq('series_id', target.seriesId));
      }

      if (error || previousError) {
        console.error('Error re-insertando serie de pendientes en Supabase:', error || previousError);
      } else {
        await loadUserData(userId);
      }
    }
  };

  const deletePendingItem = async (id: string, deleteAllSeries: boolean = false) => {
    const userId = await getActiveUserId();
    const target = pendingItems.find((p) => p.id === id);

    if (deleteAllSeries && target?.seriesId) {
      setPendingItems((prev) => prev.filter((p) => p.seriesId !== target.seriesId));
    } else {
      setPendingItems((prev) => prev.filter((p) => p.id !== id));
    }

    if (userId) {
      if (deleteAllSeries && target?.seriesId) {
        await supabase.from('pending_items').delete().eq('user_id', userId).eq('series_id', target.seriesId);
      } else {
        await supabase.from('pending_items').delete().eq('user_id', userId).eq('id', id);
      }
    }
  };

  const markPendingAsPaid = async (
    id: string,
    customAmount?: number,
    account?: string,
    card?: { installments: number; interestRate: number }
  ) => {
    const itemToPay = pendingItems.find((p) => p.id === id);
    if (!itemToPay) return;

    const paidAmount =
      customAmount !== undefined && !isNaN(customAmount) ? customAmount : itemToPay.amount;

    const paymentMethod =
      itemToPay.category.trim() === 'Inversiones' ? 'Inversiones' : account || 'Billetera';

    await addTransaction({
      type: itemToPay.type,
      name: itemToPay.name,
      amount: paidAmount,
      category: itemToPay.category,
      date: todayString(),
      paymentMethod,
      note: itemToPay.note || 'Pendiente completado',
      status: itemToPay.type === 'income' ? 'received' : 'paid',
      ...(paymentMethod === CREDIT_CARD_METHOD && {
        installments: card?.installments ?? itemToPay.installments ?? 1,
        interestRate: card?.interestRate ?? itemToPay.interestRate ?? 0,
      }),
    });

    await deletePendingItem(id);

    // Al pagar una ocurrencia de una serie, se repone la serie para que no se agote
    if (itemToPay.seriesId) {
      const userId = await getActiveUserId();
      if (userId) await loadUserData(userId);
    }
  };

  // Cambia el id temporal de un movimiento por el id que le asignó la base de datos
  const replaceTransactionId = (tempId: string, dbId: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: dbId } : t)));
  };

  // 4. Transfer money between balances
  const transferFunds = async (amount: number, direction: 'walletToInv' | 'invToWallet'): Promise<boolean> => {
    if (amount <= 0) return false;
    const { wallet, investment } = balancesRef.current;
    if (direction === 'walletToInv' ? wallet < amount : investment < amount) return false;

    const sign = direction === 'walletToInv' ? 1 : -1;
    const balanceSaved = applyBalanceDelta({ wallet: -sign * amount, investment: sign * amount, credit: 0 });

    const todayDate = todayString();
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

    await balanceSaved;
    const userId = await getActiveUserId();
    if (userId) {
      // 1. Log transfer in transfers table
      const { error: transferError } = await supabase.from('transfers').insert({
        user_id: userId,
        amount: amount,
        from_account: direction === 'walletToInv' ? 'wallet' : 'investment',
        to_account: direction === 'walletToInv' ? 'investment' : 'wallet',
      });
      if (transferError) console.error('Error registrando transferencia:', transferError);

      // 2. Log movement in transactions table
      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: newTx.type,
        name: newTx.name,
        amount: newTx.amount,
        category: newTx.category,
        date: newTx.date,
        payment_method: newTx.paymentMethod,
        note: newTx.note,
        status: newTx.status,
      }).select('id');
      if (txError) console.error('Error registrando transacción de transferencia:', txError);
      else if (txData && txData[0]) replaceTransactionId(newTx.id, txData[0].id);
    }

    return true;
  };

  // 5. Pay down the credit card debt from the wallet
  const payCreditCard = async (amount: number): Promise<boolean> => {
    const { wallet, credit } = balancesRef.current;
    if (amount <= 0) return false;
    if (amount > wallet) return false;
    if (amount > credit) return false;

    const balanceSaved = applyBalanceDelta({ wallet: -amount, investment: 0, credit: -amount });

    const todayDate = todayString();
    const newTx: Transaction = {
      id: 'tx_creditpay_' + Date.now(),
      type: 'expense',
      name: 'Pago Tarjeta de Crédito',
      amount,
      category: 'Deuda',
      date: todayDate,
      paymentMethod: 'Billetera',
      note: 'Abono a la deuda de la tarjeta de crédito',
      status: 'paid',
    };
    setTransactions((prev) => [newTx, ...prev]);

    await balanceSaved;
    const userId = await getActiveUserId();
    if (userId) {
      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: newTx.type,
        name: newTx.name,
        amount: newTx.amount,
        category: newTx.category,
        date: newTx.date,
        payment_method: newTx.paymentMethod,
        note: newTx.note,
        status: newTx.status,
      }).select('id');
      if (txError) console.error('Error registrando transacción de pago de tarjeta:', txError);
      else if (txData && txData[0]) replaceTransactionId(newTx.id, txData[0].id);
    }

    return true;
  };

  return (
    <AppContext.Provider
      value={{
        walletBalance,
        investmentBalance,
        creditCardBalance,
        creditLimit,
        categories,
        transactions,
        pendingItems,
        currentView,
        isTransferModalOpen,
        isPayCreditModalOpen,
        editingPendingItem,
        editingTransaction,
        user,
        setCurrentView,
        goBack,
        setIsTransferModalOpen,
        setIsPayCreditModalOpen,
        setEditingPendingItem,
        setEditingTransaction,
        updateBalances,
        addCategory,
        removeCategory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addPendingItem,
        updatePendingItem,
        deletePendingItem,
        markPendingAsPaid,
        transferFunds,
        payCreditCard,
        login,
        register,
        updateProfile,
        logout,
        budgets,
        budgetsAvailable,
        setBudget,
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
