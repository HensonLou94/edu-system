import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  bg: '#F3F4F6',
  sidebar: '#1E1B4B',
  sidebarHover: '#312E81',
  text: '#111827',
  textLight: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#EF4444',
};

const allMenuItems = [
  { key: 'dashboard', label: '仪表盘', path: '/', icon: '📊' },
  { key: 'students', label: '学员管理', path: '/students', icon: '👤' },
  { key: 'courses', label: '课程管理', path: '/courses', icon: '📚' },
  { key: 'teachers', label: '教师管理', path: '/teachers', icon: '👨‍🏫' },
  { key: 'schedules', label: '排课管理', path: '/schedules', icon: '📅' },
  { key: 'attendance', label: '签到考勤', path: '/attendance', icon: '✅' },
  { key: 'payments', label: '收费管理', path: '/payments', icon: '💰' },
  { key: 'homework', label: '作业管理', path: '/homework', icon: '📝' },
  { key: 'reports', label: '数据报表', path: '/reports', icon: '📈' },
];

const teacherMenuKeys = ['schedules', 'attendance', 'homework'];

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: COLORS.bg,
  },
  sidebar: {
    width: 240,
    background: COLORS.sidebar,
    color: COLORS.white,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    transition: 'transform 0.2s',
  },
  logo: {
    padding: '20px 24px',
    fontSize: 20,
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  nav: {
    flex: 1,
    padding: '12px 0',
    overflowY: 'auto',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 24px',
    margin: '2px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    background: active ? COLORS.primary : 'transparent',
    color: COLORS.white,
    textDecoration: 'none',
    transition: 'background 0.15s',
  }),
  navItemHover: {
    background: COLORS.sidebarHover,
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 240,
    right: 0,
    height: 56,
    background: COLORS.white,
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 40,
  },
  content: {
    flex: 1,
    marginLeft: 240,
    marginTop: 56,
    padding: 24,
    minHeight: 'calc(100vh - 56px)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: COLORS.primary,
    color: COLORS.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
  },
  logoutBtn: {
    padding: '6px 16px',
    border: `1px solid ${COLORS.danger}`,
    borderRadius: 6,
    background: 'transparent',
    color: COLORS.danger,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.15s',
  },
  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: COLORS.text,
    padding: 4,
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 45,
  },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'admin';
  const userName = user.name || user.email || '用户';

  const menuItems = role === 'teacher'
    ? allMenuItems.filter(item => teacherMenuKeys.includes(item.key))
    : allMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div style={styles.container}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ ...styles.overlay, display: 'block' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? { transform: 'translateX(0)' } : {}),
        }}
        className="sidebar-responsive"
      >
        <div style={styles.logo}>
          <span style={{ fontSize: 24 }}>🎓</span>
          教培管理系统
        </div>
        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.key}
                style={styles.navItem(isActive)}
                onClick={() => handleNav(item.path)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = COLORS.sidebarHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          v1.0.0
        </div>
      </aside>

      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            style={styles.mobileToggle}
            className="mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {menuItems.find(i => i.path === location.pathname)?.label || '页面'}
          </h2>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{userName.charAt(0)}</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{userName}</div>
            <div style={{ fontSize: 11, color: COLORS.textLight }}>
              {role === 'admin' ? '管理员' : '教师'}
            </div>
          </div>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.danger;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.danger;
            }}
          >
            退出
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={styles.content}>
        <Outlet />
      </main>

      {/* Responsive CSS via style tag */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-responsive {
            transform: translateX(-100%) !important;
          }
          .sidebar-responsive.sidebar-open {
            transform: translateX(0) !important;
          }
          .mobile-toggle {
            display: block !important;
          }
          main {
            margin-left: 0 !important;
          }
          header {
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
