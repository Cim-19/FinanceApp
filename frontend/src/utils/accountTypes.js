import { Wallet, PiggyBank, TrendingUp, CreditCard } from 'lucide-react';

export const ACCOUNT_TYPES = {
  CORRIENTE: {
    label:    'Corriente',
    emoji:    '💳',
    icon:     Wallet,
    gradient: 'from-blue-500 to-indigo-600',
    light:    'bg-blue-50 dark:bg-blue-900/20',
    badge:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    border:   'border-blue-200 dark:border-blue-800',
  },
  AHORRO: {
    label:    'Ahorro',
    emoji:    '🐷',
    icon:     PiggyBank,
    gradient: 'from-emerald-500 to-teal-600',
    light:    'bg-emerald-50 dark:bg-emerald-900/20',
    badge:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    border:   'border-emerald-200 dark:border-emerald-800',
  },
  INVERSION: {
    label:    'Inversión',
    emoji:    '📈',
    icon:     TrendingUp,
    gradient: 'from-violet-500 to-purple-600',
    light:    'bg-violet-50 dark:bg-violet-900/20',
    badge:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    border:   'border-violet-200 dark:border-violet-800',
  },
  CREDITO: {
    label:    'Crédito',
    emoji:    '💳',
    icon:     CreditCard,
    gradient: 'from-rose-500 to-pink-600',
    light:    'bg-rose-50 dark:bg-rose-900/20',
    badge:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    border:   'border-rose-200 dark:border-rose-800',
  },
};

export const ACCOUNT_ICONS = [
  { value: 'wallet',    emoji: '👛', label: 'Billetera'  },
  { value: 'bank',      emoji: '🏦', label: 'Banco'      },
  { value: 'savings',   emoji: '🐷', label: 'Alcancía'   },
  { value: 'card',      emoji: '💳', label: 'Tarjeta'    },
  { value: 'cash',      emoji: '💵', label: 'Efectivo'   },
  { value: 'invest',    emoji: '📈', label: 'Inversión'  },
  { value: 'crypto',    emoji: '🪙', label: 'Cripto'     },
  { value: 'house',     emoji: '🏠', label: 'Casa'       },
  { value: 'car',       emoji: '🚗', label: 'Auto'       },
  { value: 'travel',    emoji: '✈️', label: 'Viajes'     },
];

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
];

export const iconEmoji = (iconValue) =>
  ACCOUNT_ICONS.find((i) => i.value === iconValue)?.emoji || '👛';
