import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, PendingItem, ViewMode, UserProfile } from '../types';
import { supabase } from '../utils/supabase';
import { DEFAULT_CATEGORY_NAMES } from '../utils/categories';

const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_NAMES;

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
  transferFunds: (amount: number, direction: 'walletToInv' | 'invToWallet') => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string; confirmationSent?: boolean }>;
  updateProfile: (name: string, avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}




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

export const sortPendingItems = (items: PendingItem[]): PendingItem[] => {
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
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const [currentView, setCurrentView] = useState<ViewMode>('login');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingPendingItem, setEditingPendingItem] = useState<PendingItem | null>(null);

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
  }, [user]);

  // Sync Supabase Auth session & user data on load & auth state change
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        await loadUserData(session.user.id);
        setCurrentView('dashboard');
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
        setWalletBalance(0);
        setInvestmentBalance(0);
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
        .select('wallet_balance, investment_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletData) {
        setWalletBalance(Number(walletData.wallet_balance) || 0);
        setInvestmentBalance(Number(walletData.investment_balance) || 0);
      } else {
        await supabase.from('wallets').upsert(
          { user_id: userId, wallet_balance: 0, investment_balance: 0 },
          { onConflict: 'user_id' }
        );
        setWalletBalance(0);
        setInvestmentBalance(0);
      }

      // 2. Fetch Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txData) {
        setTransactions(
          txData.map((t: any) => ({
            id: t.id,
            type: t.type,
            name: t.name,
            amount: Number(t.amount),
            category: t.category,
            date: t.date,
            paymentMethod: t.payment_method,
            note: t.note,
            status: t.status,
          }))
        );
      } else {
        setTransactions([]);
      }

      // 3. Fetch Pending Items
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
  const updateBalances = async (wallet: number, investment: number) => {
    setWalletBalance(wallet);
    setInvestmentBalance(investment);

    const userId = await getActiveUserId();
    if (userId) {
      const { error } = await supabase.from('wallets').upsert(
        {
          user_id: userId,
          wallet_balance: wallet,
          investment_balance: investment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) console.error('Error actualizando saldos en Supabase:', error);
    }
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
  const applyTotalsLogic = async (category: string, amount: number, type: 'income' | 'expense', paymentMethod?: string) => {
    const isInvestment = category.trim() === 'Inversiones' || paymentMethod === 'Inversiones';
    let newWallet = walletBalance;
    let newInv = investmentBalance;

    if (isInvestment) {
      newInv = type === 'income' ? investmentBalance + amount : investmentBalance - amount;
      setInvestmentBalance(newInv);
    } else {
      newWallet = type === 'income' ? walletBalance + amount : walletBalance - amount;
      setWalletBalance(newWallet);
    }

    const userId = await getActiveUserId();
    if (userId) {
      await supabase.from('wallets').upsert(
        {
          user_id: userId,
          wallet_balance: newWallet,
          investment_balance: newInv,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const userId = await getActiveUserId();

    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now(),
    };

    await applyTotalsLogic(newTx.category, newTx.amount, newTx.type, newTx.paymentMethod);
    setTransactions((prev) => [newTx, ...prev]);

    if (userId) {
      const { data, error } = await supabase.from('transactions').insert({
        user_id: userId,
        type: tx.type,
        name: tx.name,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        payment_method: tx.paymentMethod,
        note: tx.note,
        status: tx.status,
      }).select();

      if (error) {
        console.error('Error insertando transacción en Supabase:', error);
      } else if (data && data[0]) {
        const savedTx: Transaction = {
          id: data[0].id,
          type: data[0].type,
          name: data[0].name,
          amount: Number(data[0].amount),
          category: data[0].category,
          date: data[0].date,
          paymentMethod: data[0].payment_method,
          note: data[0].note,
          status: data[0].status,
        };
        setTransactions((prev) => [savedTx, ...prev.filter((t) => t.id !== newTx.id)]);
      }
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
        type: it.type,
        name: it.name,
        amount: it.amount,
        category: it.category,
        due_date: it.dueDate,
        recurrence: it.recurrence,
        note: it.note,
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

  const updatePendingItem = async (updated: PendingItem) => {
    const userId = await getActiveUserId();
    const target = pendingItems.find((p) => p.id === updated.id);

    setPendingItems((prev) => {
      const currentTarget = prev.find((p) => p.id === updated.id) || target;
      if (!currentTarget) return prev;

      const isRecurring =
        (currentTarget.seriesId && currentTarget.seriesId.length > 0) ||
        (currentTarget.recurrence && currentTarget.recurrence !== 'none') ||
        (updated.recurrence && updated.recurrence !== 'none');

      if (!isRecurring) {
        return sortPendingItems(prev.map((item) => (item.id === updated.id ? updated : item)));
      }

      const seriesId = currentTarget.seriesId || 's_' + Date.now();
      const updatedWithSeries = { ...updated, seriesId };

      const isMatchingFuture = (p: PendingItem) => {
        if (p.id === currentTarget.id) return false;
        const sameSeries =
          (currentTarget.seriesId && p.seriesId && p.seriesId === currentTarget.seriesId) ||
          (p.name === currentTarget.name && p.category === currentTarget.category && p.type === currentTarget.type);

        if (!sameSeries) return false;

        if (currentTarget.dueDate && p.dueDate) {
          return p.dueDate >= currentTarget.dueDate;
        }
        return true;
      };

      if (!updated.recurrence || updated.recurrence === 'none') {
        return sortPendingItems(
          prev
            .filter((p) => !isMatchingFuture(p))
            .map((p) => (p.id === updated.id ? { ...updated, seriesId: undefined } : p))
        );
      }

      const remaining = prev.filter((p) => p.id !== currentTarget.id && !isMatchingFuture(p));
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

      return sortPendingItems([...remaining, updatedWithSeries, ...futureItems]);
    });

    if (userId && target) {
      const isRecurring =
        (target.seriesId && target.seriesId.length > 0) ||
        (target.recurrence && target.recurrence !== 'none') ||
        (updated.recurrence && updated.recurrence !== 'none');

      if (!isRecurring) {
        const { error } = await supabase
          .from('pending_items')
          .update({
            type: updated.type,
            name: updated.name,
            amount: updated.amount,
            category: updated.category,
            due_date: updated.dueDate,
            recurrence: updated.recurrence,
            note: updated.note,
          })
          .eq('id', updated.id)
          .eq('user_id', userId);

        if (error) {
          console.error('Error actualizando pendiente en Supabase:', error);
        } else {
          await loadUserData(userId);
        }
      } else {
        if (target.seriesId) {
          if (target.dueDate) {
            await supabase
              .from('pending_items')
              .delete()
              .eq('user_id', userId)
              .eq('series_id', target.seriesId)
              .gte('due_date', target.dueDate);
          } else {
            await supabase
              .from('pending_items')
              .delete()
              .eq('user_id', userId)
              .eq('series_id', target.seriesId);
          }
        } else {
          await supabase
            .from('pending_items')
            .delete()
            .eq('user_id', userId)
            .eq('id', updated.id);
        }

        const seriesId = target.seriesId || 's_' + Date.now();
        const updatedWithSeries = { ...updated, seriesId };
        const itemsToInsert: Omit<PendingItem, 'id'>[] = [updatedWithSeries];

        if (updated.recurrence && updated.recurrence !== 'none') {
          for (let i = 1; i <= 12; i++) {
            const nextDueDate = calculateNextDueDate(updated.dueDate, updated.recurrence, i);
            itemsToInsert.push({
              ...updatedWithSeries,
              dueDate: nextDueDate,
            });
          }
        }

        const dbRows = itemsToInsert.map((it) => ({
          user_id: userId,
          type: it.type,
          name: it.name,
          amount: it.amount,
          category: it.category,
          due_date: it.dueDate,
          recurrence: it.recurrence,
          note: it.note,
          series_id: it.seriesId,
        }));

        const { error } = await supabase.from('pending_items').insert(dbRows);
        if (error) {
          console.error('Error re-insertando serie de pendientes en Supabase:', error);
        } else {
          await loadUserData(userId);
        }
      }
    }
  };

  const deletePendingItem = async (id: string) => {
    const userId = await getActiveUserId();
    const target = pendingItems.find((p) => p.id === id);

    setPendingItems((prev) => prev.filter((p) => p.id !== id));

    if (userId) {
      if (target?.seriesId) {
        await supabase.from('pending_items').delete().eq('user_id', userId).eq('series_id', target.seriesId);
      } else {
        await supabase.from('pending_items').delete().eq('user_id', userId).eq('id', id);
      }
    }
  };

  const markPendingAsPaid = async (id: string, customAmount?: number) => {
    const itemToPay = pendingItems.find((p) => p.id === id);
    if (!itemToPay) return;

    const paidAmount =
      customAmount !== undefined && !isNaN(customAmount) ? customAmount : itemToPay.amount;

    await addTransaction({
      type: itemToPay.type,
      name: itemToPay.name,
      amount: paidAmount,
      category: itemToPay.category,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: itemToPay.category.trim() === 'Inversiones' ? 'investment' : 'debit',
      note: itemToPay.note || 'Pendiente completado',
      status: itemToPay.type === 'income' ? 'received' : 'paid',
    });

    await deletePendingItem(id);
  };

  // 4. Transfer money between balances
  const transferFunds = async (amount: number, direction: 'walletToInv' | 'invToWallet'): Promise<boolean> => {
    if (amount <= 0) return false;
    let newWallet = walletBalance;
    let newInv = investmentBalance;

    if (direction === 'walletToInv') {
      if (walletBalance < amount) return false;
      newWallet = walletBalance - amount;
      newInv = investmentBalance + amount;
    } else {
      if (investmentBalance < amount) return false;
      newInv = investmentBalance - amount;
      newWallet = walletBalance + amount;
    }

    setWalletBalance(newWallet);
    setInvestmentBalance(newInv);

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

    const userId = await getActiveUserId();
    if (userId) {
      // 1. Update wallets in Supabase with onConflict: 'user_id'
      const { error: walletError } = await supabase.from('wallets').upsert(
        {
          user_id: userId,
          wallet_balance: newWallet,
          investment_balance: newInv,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (walletError) console.error('Error actualizando billetera en transferencia:', walletError);

      // 2. Log transfer in transfers table
      const { error: transferError } = await supabase.from('transfers').insert({
        user_id: userId,
        amount: amount,
        from_account: direction === 'walletToInv' ? 'wallet' : 'investment',
        to_account: direction === 'walletToInv' ? 'investment' : 'wallet',
      });
      if (transferError) console.error('Error registrando transferencia:', transferError);

      // 3. Log movement in transactions table
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: newTx.type,
        name: newTx.name,
        amount: newTx.amount,
        category: newTx.category,
        date: newTx.date,
        payment_method: newTx.paymentMethod,
        note: newTx.note,
        status: newTx.status,
      });
      if (txError) console.error('Error registrando transacción de transferencia:', txError);
    }

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
        login,
        register,
        updateProfile,
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
