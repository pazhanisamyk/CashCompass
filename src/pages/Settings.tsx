import React, { useRef, useState } from 'react';
import { useAppTheme, currencies, languages } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import {
  Sun,
  Moon,
  Globe,
  Coins,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, currency, setCurrency, language, setLanguage } = useAppTheme();
  const { resetAllData, backupData, restoreData } = useData();
  const { toast } = useToast();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup downloader
  const handleBackup = () => {
    const payload = backupData();
    if (!payload) return;
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CashCompass_finance_backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Backup downloaded successfully.', 'success');
  };

  // Restore importer
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = restoreData(result);
      if (success && fileInputRef.current) {
        fileInputRef.current.value = ''; // clear file input
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    resetAllData();
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure layout options, default currencies, and backup parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preference Settings Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <h3 className="font-bold text-slate-850 dark:text-white text-base">Regional & Theme Options</h3>

          {/* Theme setting */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appearance Theme</span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setTheme('light')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                <Sun className="w-4.5 h-4.5" /> Light Mode
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-650'
                }`}
              >
                <Moon className="w-4.5 h-4.5" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Currency setting */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Preferred Currency
            </label>
            <div className="relative">
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Language setting */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              System Language
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Database Management Settings Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <h3 className="font-bold text-slate-850 dark:text-white text-base">Database & Storage Controls</h3>

          {/* Backup data */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Export Backups</span>
            <p className="text-xs text-slate-500">Download a local JSON package containing all income and expense logs.</p>
            <button
              onClick={handleBackup}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Backup
            </button>
          </div>

          {/* Restore data */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Import Backup Payload</span>
            <p className="text-xs text-slate-500">Restore records from a previously exported JSON backup file.</p>
            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> Upload JSON file
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleRestore}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset all data */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="block text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Database Wipe
            </span>
            <p className="text-xs text-slate-500">Clear all income transactions, budgets, goals, and logs from this profile.</p>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-450 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Database
            </button>
          </div>
        </div>
      </div>

      {/* Database Reset confirmation modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Database Reset"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex gap-2.5">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This is a permanent operation!</p>
              <p className="mt-1">All registered transactions, category budgets, savings goals, and recurring bills will be wiped from storage. You cannot undo this action.</p>
            </div>
          </div>
          <p className="text-sm text-slate-650 dark:text-slate-350 font-medium">
            Are you sure you want to clear your local database?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleResetConfirm}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 transition-colors cursor-pointer"
            >
              Confirm Database Wipe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
