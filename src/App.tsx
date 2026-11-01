import type { ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { backend } from './lib/backend';
import { AuthProvider, useAuth } from './lib/auth';
import BatchPage from './pages/BatchPage';
import CollagePage from './pages/CollagePage';
import ComposePage from './pages/ComposePage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TemplateEditorPage from './pages/TemplateEditorPage';

function Shell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page center"><div className="spinner" /></div>;
  return (
    <>
      <header className="header">
        <NavLink to="/" className="brand">
          <img src="./icon.svg" alt="" width={28} height={28} />
          <span>Khung Ảnh</span>
        </NavLink>
        <nav>
          <NavLink to="/" end>Khung mẫu</NavLink>
          <NavLink to="/collage">Ghép ảnh</NavLink>
          <NavLink to="/history">Lịch sử</NavLink>
        </nav>
        {user ? (
          <button
            className="user"
            title={`${user.displayName}\n${user.email}\nNhấn để đăng xuất`}
            onClick={() => confirm('Đăng xuất?') && backend.signOut()}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{user.displayName.charAt(0).toUpperCase()}</span>
            )}
          </button>
        ) : (
          <NavLink to="/login" className="btn primary sm">
            Đăng nhập
          </NavLink>
        )}
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Shell><HomePage /></Shell>} />
          <Route path="/history" element={<Shell><HistoryPage /></Shell>} />
          <Route path="/templates/new" element={<Shell><TemplateEditorPage key="new" /></Shell>} />
          <Route path="/templates/:id/edit" element={<Shell><TemplateEditorPage /></Shell>} />
          <Route path="/compose/:id" element={<Shell><ComposePage /></Shell>} />
          <Route path="/batch/:id" element={<Shell><BatchPage /></Shell>} />
          <Route path="/collage" element={<Shell><CollagePage /></Shell>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
