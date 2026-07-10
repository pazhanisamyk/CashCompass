import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickAddTransactionModal } from '../QuickAddTransactionModal';
import { useToast } from '../../context/ToastContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in input/textarea/select
      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT'
      );
      if (isInput) return;

      // Alt + E -> Quick Add Expense
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setQuickAddType('expense');
      }
      // Alt + I -> Quick Add Income
      else if (e.altKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setQuickAddType('income');
      }
      // Navigation Shortcuts: g + d (dashboard), g + e (expenses), g + i (income), g + b (budgets), g + s (settings)
      else if (e.key.toLowerCase() === 'd') {
        // We look for double keypress, or simple prefix keys. For simplicity: Alt + D etc
        if (e.altKey) {
          e.preventDefault();
          navigate('/');
          toast('Navigated to Dashboard', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toast]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main page content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          onQuickAddExpense={() => setQuickAddType('expense')}
          onQuickAddIncome={() => setQuickAddType('income')}
        />
        
        {/* Router Outlet for page views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-slide-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddTransactionModal
        isOpen={quickAddType !== null}
        onClose={() => setQuickAddType(null)}
        type={quickAddType || 'expense'}
      />
    </div>
  );
};
