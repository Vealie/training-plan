import { createContext, useContext, useState, useCallback } from 'react';
import {
  initGoogleAuth,
  requestToken,
  getToken,
  signOut as authSignOut,
} from '../services/googleAuth.js';

const AuthContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '516778943804-4cfmo9dridrvlo62pavftvogq9fq3vj3.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | loading | authenticated | error
  const [error, setError] = useState(null);

  const signIn = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      if (!CLIENT_ID) {
        throw new Error(
          'No Google Client ID found. Create a .env.local file with VITE_GOOGLE_CLIENT_ID=your-client-id'
        );
      }
      await initGoogleAuth(CLIENT_ID);
      await requestToken('consent');
      setStatus('authenticated');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  const silentSignIn = useCallback(async () => {
    if (!CLIENT_ID) return false;
    try {
      await initGoogleAuth(CLIENT_ID);
      // Try a silent token request (no popup)
      await requestToken('');
      setStatus('authenticated');
      return true;
    } catch {
      setStatus('idle');
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    authSignOut();
    setStatus('idle');
    setError(null);
  }, []);

  const token = status === 'authenticated' ? getToken() : null;

  return (
    <AuthContext.Provider value={{ status, error, token, signIn, silentSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
