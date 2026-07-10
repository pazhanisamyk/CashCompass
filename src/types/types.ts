export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  profilePicture?: string; // Base64 encoded string
}

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investment'
  | 'Rental'
  | 'Bonus'
  | 'Gift'
  | 'Other';

export interface Income {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: IncomeCategory;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export type ExpenseCategory =
  | 'Food'
  | 'Shopping'
  | 'Rent'
  | 'Fuel'
  | 'Medical'
  | 'Travel'
  | 'Entertainment'
  | 'Utilities'
  | 'Education'
  | 'Insurance'
  | 'Subscription'
  | 'Investment'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Mobile Payment' | 'Other';

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  notes?: string;
  tags?: string[];
  favorite?: boolean;
}

export type BudgetType = 'monthly' | 'category';

export interface Budget {
  id: string;
  userId: string;
  type: BudgetType;
  category?: ExpenseCategory; // null if type is 'monthly'
  limitAmount: number;
  period: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string; // YYYY-MM-DD
}

export interface Bill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paid: boolean;
  repeatMonthly: boolean;
}

export type NotificationType = 'budget_exceeded' | 'goal_completed' | 'bill_due' | 'monthly_summary' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string; // ISO string
  read: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  currency: string; // currency code, e.g., 'USD', 'EUR', 'INR'
  language: string; // language code, e.g., 'en', 'es', 'fr'
}
