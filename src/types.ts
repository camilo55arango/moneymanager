export type ViewMode = 'setup' | 'dashboard' | 'pendientes' | 'estadisticas' | 'new-transaction' | 'new-pending' | 'login';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string; // 'cash' | 'credit' | 'debit' | 'transfer'
  note?: string;
  status: 'paid' | 'received' | 'pending';
}

export interface PendingItem {
  id: string;
  type: TransactionType;
  name: string;
  amount: number; // 0 means TBD / budget pending
  category: string;
  dueDate: string | null; // YYYY-MM-DD or null for Sin Fecha
  recurrence?: string; // 'none' | 'semanal' | 'mensual' | 'bimensual' | 'trimestral' | 'semestral' | 'anual'
  note?: string;
  seriesId?: string;
  paymentMethod?: string; // 'Billetera' | 'Tarjeta de Crédito' (solo gastos)
}

// Al editar un pendiente recurrente: solo esa ocurrencia o toda la serie
export type PendingEditScope = 'single' | 'series';

export interface TransferData {
  amount: number;
  from: 'wallet' | 'investment';
  to: 'wallet' | 'investment';
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
}
