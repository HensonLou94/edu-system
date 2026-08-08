import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
    marginBottom: 32,
  },
  statCard: (color) => ({
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderLeft: `4px solid ${color}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'default',
  }),
  statIcon: (color) => ({
    width: 44,
    height: 44,
    borderRadius: 10,
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    marginBottom: 12,
  }),
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
  },
  section: {
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 16,
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  recentItemLast: {
    borderBottom: 'none',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#6B7280',
    fontSize: 14,
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 20,
  },
  retryBtn: {
    marginTop: 8,
    padding: '6px 16px',
    background: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  emptyHint: {
    textAlign: 'center',
    padding: 40,
    color: '#9CA3AF',
    fontSize: 13,
  },
};

const statCards = [
  { key: 'totalStudents', label: '学员总数', icon: '👤', color: '#4F46E5', suffix: '人' },
  { key: 'totalTeachers', label: '教师总数', icon: '👨‍🏫', color: '#10B981', suffix: '人' },
  { key: 'totalCourses', label: '课程总数', icon: '📚', color: '#F59E0B', suffix: '门' },
  { key: 'monthlyIncome', label: '本月收入', icon: '💰', color: '#EF4444', prefix: '¥', suffix: '' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  if (loading) {
    return <div style={styles.loading}>⏳ 加载中...</div>;
  }

  if (error) {
    return (
      <div>
        <div style={styles.errorBox}>
          <div>⚠️ {error}</div>
          <button style={styles.retryBtn} onClick={fetchData}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.greeting}>{greeting}，{user.name || user.email || '用户'} 👋</h1>
      <p style={styles.subGreeting}>欢迎回到教培管理系统</p>

      <div style={styles.statsGrid}>
        {statCards.map((card) => {
          const value = data?.[card.key] ?? 0;
          return (
            <div
              key={card.key}
              style={styles.statCard(card.color)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
              }}
            >
              <div style={styles.statIcon(card.color)}>{card.icon}</div>
              <div style={styles.statLabel}>{card.label}</div>
              <div style={styles.statValue}>
                {card.prefix || ''}
                {typeof value === 'number' ? value.toLocaleString() : value}
                {card.suffix || ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷入口 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>快捷操作</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '学员管理', path: '/students', icon: '👤' },
            { label: '排课管理', path: '/schedules', icon: '📅' },
            { label: '签到考勤', path: '/attendance', icon: '✅' },
            { label: '收费管理', path: '/payments', icon: '💰' },
            { label: '数据报表', path: '/reports', icon: '📈' },
          ].map((item) => (
            <a
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 20px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                color: '#374151',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EEF2FF';
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#374151';
              }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
