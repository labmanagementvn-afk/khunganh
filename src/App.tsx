import type { ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from './components/Icon';
import { AuthProvider, useAuth } from './lib/auth';
import AccountPage from './pages/AccountPage';
import BatchPage from './pages/BatchPage';
import CollagePage from './pages/CollagePage';
import ComposePage from './pages/ComposePage';
import FeedPage from './pages/FeedPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PublicTemplatePage from './pages/PublicTemplatePage';
import TemplateEditorPage from './pages/TemplateEditorPage';

/** Trang cấp cao nhất – hiện thanh điều hướng dưới đáy trên điện thoại */
const TOP_LEVEL = ['/', '/feed', '/collage', '/account'];

function Shell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="page center"><div className="spinner" /></div>;

  const account = user ? (
    <NavLink to="/account" className="user" title={`${user.displayName}\n${user.email}`}>
      {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span>{user.displayName.charAt(0).toUpperCase()}</span>}
    </NavLink>
  ) : (
    <NavLink to="/login" className="btn primary sm">
      Đăng nhập
    </NavLink>
  );

  return (
    <div className={TOP_LEVEL.includes(pathname) ? 'shell with-tabbar' : 'shell'}>
      <header className="header">
        <NavLink to="/" className="brand">
          <img src="./icon.svg" alt="" width={28} height={28} />
          <span>Khung Ảnh</span>
        </NavLink>
        <nav className="top-nav">
          <NavLink to="/" end>Khung mẫu</NavLink>
          <NavLink to="/feed">Bảng tin</NavLink>
          <NavLink to="/collage">Ghép ảnh</NavLink>
        </nav>
        <div className="header-account">{account}</div>
      </header>
      <main>{children}</main>
      <nav className="tabbar" aria-label="Điều hướng">
        <NavLink to="/" end>
          <Icon name="frame" size={22} />
          <span>Khung mẫu</span>
        </NavLink>
        <NavLink to="/feed">
          <Icon name="feed" size={22} />
          <span>Bảng tin</span>
        </NavLink>
        <NavLink to="/collage">
          <Icon name="grid" size={22} />
          <span>Ghép ảnh</span>
        </NavLink>
        <NavLink to="/account">
          <Icon name="user" size={22} />
          <span>Tài khoản</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Shell><HomePage /></Shell>} />
          <Route path="/feed" element={<Shell><FeedPage /></Shell>} />
          <Route path="/t/:id" element={<Shell><PublicTemplatePage /></Shell>} />
          <Route path="/account" element={<Shell><AccountPage /></Shell>} />
          <Route path="/history" element={<Navigate to="/account" replace />} />
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
