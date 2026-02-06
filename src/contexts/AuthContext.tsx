import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsDB, AppSettings } from '@/lib/database';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isPinSetup: boolean;
  failedAttempts: number;
  isLocked: boolean;
  settings: AppSettings | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  setupPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinSetup, setIsPinSetup] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

  const refreshSettings = useCallback(async () => {
    try {
      let currentSettings = await settingsDB.get();
      if (!currentSettings) {
        currentSettings = await settingsDB.initialize();
      }
      setSettings(currentSettings);
      setIsPinSetup(!!currentSettings.pinHash);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshSettings();
      
      // Check session storage for existing auth
      const sessionAuth = sessionStorage.getItem('keke-auth');
      if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
      
      // Check for lockout
      const storedLockout = localStorage.getItem('keke-lockout');
      if (storedLockout) {
        const lockoutTime = parseInt(storedLockout, 10);
        if (Date.now() < lockoutTime) {
          setLockoutUntil(lockoutTime);
        } else {
          localStorage.removeItem('keke-lockout');
        }
      }
      
      const storedAttempts = localStorage.getItem('keke-failed-attempts');
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10));
      }
      
      setIsLoading(false);
    };
    init();
  }, [refreshSettings]);

  // Clear lockout after duration
  useEffect(() => {
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
      localStorage.removeItem('keke-lockout');
      localStorage.removeItem('keke-failed-attempts');
    }
  }, [lockoutUntil]);

  const login = async (pin: string): Promise<boolean> => {
    if (isLocked) return false;

    const isValid = await settingsDB.verifyPin(pin);
    
    if (isValid) {
      setIsAuthenticated(true);
      setFailedAttempts(0);
      sessionStorage.setItem('keke-auth', 'true');
      localStorage.removeItem('keke-failed-attempts');
      return true;
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('keke-failed-attempts', newAttempts.toString());
      
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('keke-lockout', lockoutTime.toString());
      }
      
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('keke-auth');
  };

  const setupPin = async (pin: string): Promise<boolean> => {
    try {
      await settingsDB.setPin(pin);
      setIsPinSetup(true);
      setIsAuthenticated(true);
      sessionStorage.setItem('keke-auth', 'true');
      await refreshSettings();
      return true;
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      return false;
    }
  };

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    const isValid = await settingsDB.verifyPin(oldPin);
    if (!isValid) return false;
    
    try {
      await settingsDB.setPin(newPin);
      await refreshSettings();
      return true;
    } catch (error) {
      console.error('Failed to change PIN:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isPinSetup,
        failedAttempts,
        isLocked,
        settings,
        login,
        logout,
        setupPin,
        changePin,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
