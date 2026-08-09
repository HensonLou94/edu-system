import React, { useState, useEffect } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Reports() {
  const [tab, setTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    setData(null);
    const url = tab === 'revenue' ? `/api/reports/revenue?year=${year}` : `/api/reports/${tab}`;
    axios.get(url, { headers: headers() })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, year]);

  const tabs = [
    { key: 'revenue', label: '💰 收入报表' },
    { key: 'students', label: '👥 学员统计' },
    { key: 'courses', label: '📚 课程统计' },
    { key: 'teachers', label: '👨‍🏫 教师统计' },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据报表</h1>
          <p className="page-subtitle">数据可视化分析</p>
        </div>
        {tab === 'revenue' && (
          <select className="form-select" style={{ width: 120 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}年</option>;
            })}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid var(--gray-100)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              background: tab === t.key ? 'var(--primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--gray-600)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card"><div className="card-body loading-page"><div className="loading-spinner" /><span>加载中...</span></div></div>
      ) : !data ? (
        <div className="card"><div className="card-body"><div className="empty-state"><div className="icon">📊</div><div className="text">暂无数据</div></div></div></div>
      ) : (
        <div className="fade-in">
          {tab === 'revenue' && <RevenueReport data={data} />}
          {tab === 'students' && <StudentReport data={data} />}
          {tab === 'courses' && <CourseReport data={data} />}
          {tab === 'teachers' && <TeacherReport data={data} />}
        </div>
      )}
    </div>
  );
}

/* ---- Revenue ---- */
function RevenueReport({ data }) {
  const months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const maxAmount = Math.max(...(data || []).map(d => Number(d.amount) || 0), 1);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">月度收入趋势</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 240, padding: '0 4px' }}>
            {[...Array(12)].map((_, i) => {
              const item = (data || []).find(d => d.month === i + 1);
              const amount = Number(item?.amount) || 0;
              const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500 }}>
                    {amount > 0 ? `¥${(amount / 1000).toFixed(1)}k` : ''}
                  </span>
                  <div style={{
                    width: '100%', height: `${Math.max(pct, 2)}%`, background: amount > 0 ? 'var(--primary)' : 'var(--gray-100)',
                    borderRadius: '4px 4px 0 0', transition: 'height 0.3s', minHeight: 4,
                  }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{months[i].slice(0, 2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">收入明细</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>月份</th><th>收入金额</th><th>笔数</th></tr></thead>
            <tbody>
              {(data || []).map(d => (
                <tr key={d.month}>
                  <td>{months[d.month - 1]}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{Number(d.amount || 0).toLocaleString()}</td>
                  <td>{d.count || 0} 笔</td>
                </tr>
              ))}
              {(!data || data.length === 0) && <tr><td colSpan={3}><div className="empty-state"><div className="text">暂无数据</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- Students ---- */
function StudentReport({ data }) {
  const { byGrade = [], byGender = [], monthlyEnrollment = [] } = data || {};
  const maxGrade = Math.max(...byGrade.map(g => g.count), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">按年级分布</span></div>
        <div className="card-body">
          {byGrade.length === 0 ? <div className="empty-state"><div className="text">暂无数据</div></div> :
            byGrade.map(g => (
              <div key={g.grade || '未知'} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{g.grade || '未设置'}</span><span style={{ fontWeight: 600 }}>{g.count} 人</span>
                </div>
                <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(g.count / maxGrade) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">按性别分布</span></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 20px' }}>
          {byGender.length === 0 ? <div className="text">暂无数据</div> :
            byGender.map(g => (
              <div key={g.gender} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <span style={{ width: 40, fontSize: 20 }}>{g.gender === 'male' ? '👦' : '👧'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{g.gender === 'male' ? '男' : '女'}</span>
                    <span style={{ fontWeight: 600 }}>{g.count} 人</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(g.count / Math.max(...byGender.map(x => x.count), 1)) * 100}%`, height: '100%', background: g.gender === 'male' ? '#3B82F6' : '#EC4899', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="card-header"><span className="card-title">月度招生</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8, height: 160, alignItems: 'flex-end' }}>
            {[...Array(12)].map((_, i) => {
              const item = monthlyEnrollment.find(m => m.month === i + 1);
              const count = item?.count || 0;
              const max = Math.max(...monthlyEnrollment.map(m => m.count), 1);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{count > 0 ? count : ''}</span>
                  <div style={{ width: '100%', height: `${Math.max((count / max) * 100, 2)}%`, background: count > 0 ? '#10B981' : 'var(--gray-100)', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{i + 1}月</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Courses ---- */
function CourseReport({ data }) {
  const { bySubject = [], courseRevenue = [] } = data || {};

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">按科目统计</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>科目</th><th>课程数</th><th>学员数</th></tr></thead>
            <tbody>
              {bySubject.length === 0 ? <tr><td colSpan={3}><div className="empty-state"><div className="text">暂无数据</div></div></td></tr> :
                bySubject.map(s => (
                  <tr key={s.subject}>
                    <td><span className="badge badge-primary">{s.subject}</span></td>
                    <td>{s.course_count}</td>
                    <td style={{ fontWeight: 600 }}>{s.student_count}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">课程收入 TOP 10</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>课程</th><th>科目</th><th>收入</th></tr></thead>
            <tbody>
              {courseRevenue.length === 0 ? <tr><td colSpan={3}><div className="empty-state"><div className="text">暂无数据</div></div></td></tr> :
                courseRevenue.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><span className="badge badge-gray">{c.subject}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{Number(c.revenue || 0).toLocaleString()}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- Teachers ---- */
function TeacherReport({ data }) {
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">教师课时统计</span></div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>教师</th><th>科目</th><th>课时数</th><th>关联收入</th></tr></thead>
          <tbody>
            {(!data || data.length === 0) ? <tr><td colSpan={4}><div className="empty-state"><div className="icon">👨‍🏫</div><div className="text">暂无数据</div></div></td></tr> :
              data.map((t, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td><span className="badge badge-primary">{t.subjects || '-'}</span></td>
                  <td>{t.total_hours || 0} 课时</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{Number(t.total_payment || 0).toLocaleString()}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
