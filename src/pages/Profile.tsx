import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, deleteAccount } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setProfilePic(currentUser.profilePicture || '');
    }
  }, [currentUser]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePic(base64String);
      updateProfile(name, email, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast('Name and email are required.', 'error');
      return;
    }
    const success = updateProfile(name, email, profilePic);
    if (success) {
      // update succeeded
    }
  };

  const handleDeleteConfirm = () => {
    deleteAccount();
    setIsDeleteModalOpen(false);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your user profile details and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar Display */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            {profilePic ? (
              <img
                src={profilePic}
                alt={name}
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-4xl shadow-md border-4 border-slate-200 dark:border-slate-800">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full cursor-pointer shadow-md transition-colors border-2 border-white dark:border-slate-900">
              <Camera className="w-4.5 h-4.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{name}</h3>
            <p className="text-sm text-slate-450 dark:text-slate-500">{email}</p>
          </div>
        </div>

        {/* Right Column: Update Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-850 dark:text-white text-lg">General Settings</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-855 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
            >
              Update Settings
            </button>
          </form>

          {/* Delete account Danger zone */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <h4 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently delete this user account. This operation is irreversible and all your transaction records will be wiped.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex gap-2.5">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This is a permanent operation!</p>
              <p className="mt-1">Deleting your account removes all records of incomes, expenses, budgets, savings goals, and configuration logs. It cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-slate-650 dark:text-slate-350">
            Are you sure you want to delete your profile?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 transition-colors cursor-pointer"
            >
              Confirm Account Wipe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
