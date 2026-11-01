import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser } from '../types';
import { backend, type Backend } from './backend';
import { localBackend } from './backend/local';

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

export interface Session {
  user: AppUser | null;
  uid: string;
  /** Nơi lưu khung mẫu: Firebase khi đã đăng nhập, bộ nhớ trình duyệt khi dùng không đăng nhập */
  store: Backend;
  /** Khách (chưa đăng nhập): vẫn tạo được ảnh nhưng không lưu lịch sử */
  guest: boolean;
  /** Kho mẫu công khai (Bảng tin) – dùng chung cho mọi người, kể cả khách */
  pub: Backend;
}

const GUEST: Session = { user: null, uid: 'guest', store: localBackend, guest: true, pub: backend };

export function useSession(): Session {
  const { user } = useAuth();
  return user ? { user, uid: user.uid, store: backend, guest: false, pub: backend } : GUEST;
}
