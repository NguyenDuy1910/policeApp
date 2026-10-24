import { Building2, ClipboardList, LogOut, MapPinned, Menu, MessageSquareText, Shield, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ADMIN_SESSION_EXPIRED_EVENT, adminApi } from './api';
import { Incidents } from './features/Incidents';
import { Places } from './features/Places';
import { PoliceUnits } from './features/PoliceUnits';
import { Reviews } from './features/Reviews';

type ModuleKey = 'incidents' | 'units' | 'places' | 'reviews';

const navigation: { key: ModuleKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'incidents', label: 'Tin báo', icon: ClipboardList },
  { key: 'units', label: 'Đơn vị công an', icon: Building2 },
  { key: 'places', label: 'Cơ sở & dịch vụ', icon: MapPinned },
  { key: 'reviews', label: 'Đánh giá', icon: MessageSquareText },
];

export function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [module, setModule] = useState<ModuleKey>('incidents');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    adminApi.me()
      .then((session) => {
        setAuthenticated(session.authenticated);
        if (session.username) setUsername(session.username);
        if (session.displayName) setDisplayName(session.displayName);
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setAuthenticated(false);
      setDisplayName('');
      setPassword('');
      setLoginError('Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.');
    };
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expireSession);
  }, []);

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoggingIn(true);
    try {
      const session = await adminApi.login(username, password);
      setDisplayName(session.admin.displayName);
      setAuthenticated(true);
      setPassword('');
      setLoginError('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Không thể đăng nhập.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await adminApi.logout();
    } finally {
      setAuthenticated(false);
      setUsername('');
      setDisplayName('');
      setPassword('');
    }
  }

  function navigate(nextModule: ModuleKey): void {
    setModule(nextModule);
    setMenuOpen(false);
  }

  if (checkingSession) return <div className="app-loading"><Shield size={34} /><span>Đang kiểm tra phiên quản trị…</span></div>;
  if (!authenticated) {
    return (
      <main className="login-page">
        <section className="login-brand">
          <div className="brand-mark"><Shield size={31} /></div>
          <p className="eyebrow eyebrow--light">VNPolice Care</p>
          <h1>Trung tâm tiếp nhận<br />tin báo.</h1>
          <p>Tiếp nhận, phân công và cập nhật tiến độ tin báo của người dân trên địa bàn tỉnh Cà Mau.</p>
        </section>
        <section className="login-panel">
          <form className="login-card" onSubmit={(event) => void login(event)}>
            <p className="eyebrow">Truy cập nội bộ</p>
            <h2>Đăng nhập quản trị</h2>
            <p>Dành cho cán bộ trực ban đã được cấp tài khoản.</p>
            {loginError ? <div className="form-error" role="alert">{loginError}</div> : null}
            <label className="field"><span>Tên đăng nhập</span><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
            <label className="field"><span>Mật khẩu</span><input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button type="submit" className="button button--primary full" disabled={loggingIn}>{loggingIn ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
            <small>Phiên dùng cookie HttpOnly và tự hết hạn sau 8 giờ.</small>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand"><div className="brand-mark brand-mark--small"><Shield size={24} /></div><div><strong>VNPolice Care</strong><span>Trung tâm tiếp nhận</span></div><button type="button" className="sidebar-close" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.key} type="button" className={module === item.key ? 'active' : ''} onClick={() => navigate(item.key)}><Icon size={19} /> {item.label}</button>;
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-profile">
            <img className="admin-avatar" src="/images/cong-an-hieu-avatar.jpg" alt="" />
            <div className="sidebar-profile__identity"><span>{username}</span><strong>{displayName || username}</strong></div>
          </div>
          <button type="button" onClick={() => void logout()}><LogOut size={18} /> Đăng xuất</button>
        </div>
      </aside>
      {menuOpen ? <button type="button" className="mobile-backdrop" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" /> : null}
      <main className="main-area">
        <header className="mobile-header"><button type="button" aria-label="Mở menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><strong>VNPolice Care</strong><span /></header>
        {module === 'incidents' ? <Incidents /> : null}
        {module === 'units' ? <PoliceUnits /> : null}
        {module === 'places' ? <Places /> : null}
        {module === 'reviews' ? <Reviews /> : null}
      </main>
    </div>
  );
}
