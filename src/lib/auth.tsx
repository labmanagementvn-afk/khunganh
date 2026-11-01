import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser } from '../types';
import { backend } from './backend';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => backend.onAuthChange((user) => setState({ user, loading: false })), []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Dùng trong các trang đã được bảo vệ bởi RequireAuth */
export function useUser(): AppUser {
  const { user } = useAuth();
  if (!user) throw new Error('Chưa đăng nhập');
  return user;
}
