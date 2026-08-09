import React, { useState, useEffect } from 'react';
import axios from 'axios';

const token = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

const formatMoney = (n) => '¥' + (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0 });

const statCards = [
  { key: 'totalStudents', label: '学员总数', icon: '👥', color: '#EFF6FF', textColor: '#3B82F6' },
  { key: 'totalTeachers', label: '教师总数', icon: '👨‍🏫', color: '#F0FDF4', textColor: '#10B981' },
  { key: 'totalCourses', label: '课程总数', icon: '📚', color: '#FEF3C7', textColor: '#F59E0B' },
  { key: 'todayAttendance', label: '今日签到', icon: '✅', color: '#F0F9FF', textColor: '#0EA5E9' },
  { key: 'totalRevenue', label: '年度营收', icon: '💰', color: '#FDF2F8', textColor: '#EC4899', format: formatMoney },
  { key: 'monthRevenue', label: '本月营收', icon: '📊', color: '#F5F3FF', textColor: '#8B5CF6', format: formatMoney },
  { key: 'pendingPayments', label: '待缴费', icon: '⏳', color: '#FFF7ED', textColor: '#F97316' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/dashboard', { headers: headers() })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 160, height: 28, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 120, height: 16 }} />
          </div>
        </div>
        <div className="stats-grid">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表盘</h1>
          <p className="page-subtitle">数据概览</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.key} className="stat-card">
            <div className="icon" style={{ background: card.color, color: card.textColor }}>
              {card.icon}
            </div>
            <div className="value">
              {card.format ? card.format(data?.[card.key]) : (data?.[card.key] ?? 0)}
            </div>
            <div className="label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📌 快速操作</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickLink to="/students" icon="➕" text="新增学员" />
            <QuickLink to="/schedules" icon="📅" text="排课管理" />
            <QuickLink to="/attendance" icon="✅" text="今日签到" />
            <QuickLink to="/payments" icon="💰" text="收费录入" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 系统信息</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--gray-600)' }}>
            <InfoRow label="年度营收" value={formatMoney(data?.totalRevenue)} />
            <InfoRow label="本月营收" value={formatMoney(data?.monthRevenue)} />
            <InfoRow label="活跃学员" value={`${data?.totalStudents || 0} 人`} />
            <InfoRow label="活跃教师" value={`${data?.totalTeachers || 0} 人`} />
            <InfoRow label="今日签到" value={`${data?.todayAttendance || 0} 人次`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, text }) {
  return (
    <a
      href={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: 'var(--gray-50)', borderRadius: 8, textDecoration: 'none',
        color: 'var(--gray-700)', fontSize: 13, transition: 'all 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{text}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--gray-400)' }}>→</span>
    </a>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{value}</span>
    </div>
  );
}
