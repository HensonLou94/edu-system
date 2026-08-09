import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/students', label: '学员', icon: '👥' },
  { path: '/courses', label: '课程', icon: '📚' },
  { path: '/teachers', label: '教师', icon: '👨‍🏫' },
  { path: '/schedules', label: '排课', icon: '📅' },
  { path: '/attendance', label: '签到', icon: '✅' },
  { path: '/payments', label: '收费', icon: '💰' },
  { path: '/homework', label: '作业', icon: '📝' },
  { path: '/reports', label: '报表', icon: '📈' },
];

const roleLabels = { admin: '管理员', frontdesk: '前台', teacher: '教师' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Top Nav */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🎓</span>
            <span style={styles.brandText}>教培管理系统</span>
          </div>

          <nav style={styles.nav}>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  color: isActive ? 'var(--primary)' : 'var(--gray-600)',
                  background: isActive ? 'var(--primary-bg)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div style={styles.userArea}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.[0] || 'U'}</div>
              <div>
                <div style={styles.userName}>{user?.name || '用户'}</div>
                <div style={styles.userRole}>{roleLabels[user?.role] || user?.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="退出登录">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid var(--gray-100)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  headerInner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 32px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  brandIcon: { fontSize: 22 },
  brandText: { fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' },
  nav: {
    display: 'flex',
    gap: 2,
    flex: 1,
    overflowX: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  navIcon: { fontSize: 14 },
  navLabel: {},
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' },
  userRole: { fontSize: 11, color: 'var(--gray-400)' },
  logoutBtn: {
    padding: '5px 12px',
    border: '1px solid var(--gray-200)',
    borderRadius: 6,
    background: '#fff',
    color: 'var(--gray-600)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    minHeight: 'calc(100vh - 56px)',
  },
};
