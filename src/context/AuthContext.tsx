import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/types';
import { useToast } from './ToastContext';
import { storage } from '../utils/storage';

interface AuthContextProps {
  currentUser: User | null;
  isLoggedIn: boolean;
  users: User[];
  login: (email: string, password: string, rememberMe: boolean) => boolean;
  registerUser: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (name: string, email: string, profilePictureUrl?: string) => boolean;
  deleteAccount: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = storage.getItem('users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = storage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return storage.getItem('isLoggedIn') === 'true';
  });


  useEffect(() => {
    storage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      storage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      storage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    storage.setItem('isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);


  const login = (email: string, password: string, rememberMe: boolean): boolean => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    // In a pure frontend app, we mock compare password. For demo we accept password check.
    if (user && user.password === password) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      if (rememberMe) {
        storage.setItem('remember_me', 'true');
      } else {
        storage.removeItem('remember_me');
      }

      toast(`Welcome back, ${user.name}!`, 'success');
      return true;
    }
    
    toast('Invalid email or password.', 'error');
    return false;
  };

  const registerUser = (name: string, email: string, password: string): boolean => {
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      toast('A user with this email already exists.', 'error');
      return false;
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      email,
      password,
      profilePicture: '',
    };

    setUsers((prev) => [...prev, newUser]);
    toast('Registration successful! You can now login.', 'success');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    storage.removeItem('remember_me');
    toast('You have logged out.', 'info');

  };

  const updateProfile = (name: string, email: string, profilePictureUrl?: string): boolean => {
    if (!currentUser) return false;

    // Check if email is already taken by someone else
    const emailTaken = users.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === email.toLowerCase()
    );

    if (emailTaken) {
      toast('This email is already taken.', 'error');
      return false;
    }

    const updatedUser: User = {
      ...currentUser,
      name,
      email,
      profilePicture: profilePictureUrl !== undefined ? profilePictureUrl : currentUser.profilePicture,
    };

    // Update in users array
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    // Update in current user session
    setCurrentUser(updatedUser);
    toast('Profile updated successfully!', 'success');
    return true;
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    
    const userId = currentUser.id;
    // Remove from users list
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    
    // Clear current user
    setCurrentUser(null);
    setIsLoggedIn(false);

    // Clean user specific data from storage keys
    const cleanupUserKeys = ['incomes', 'expenses', 'budgets', 'goals', 'bills', 'notifications'];
    cleanupUserKeys.forEach((key) => {
      const savedData = storage.getItem(key);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => item.userId !== userId);
            storage.setItem(key, JSON.stringify(filtered));
          }
        } catch (e) {
          // ignore
        }
      }
    });


    toast('Your account and all associated data have been deleted.', 'warning');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        users,
        login,
        registerUser,
        logout,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
