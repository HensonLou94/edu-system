import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 24px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 },
  card: { background: '#FFF', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, paddingTop: 10 },
  barWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  bar: (value, max) => ({
    width: '100%',
    maxWidth: 40,
    height: `${max > 0 ? (value / max) * 130 : 0}px`,
    background: 'linear-gradient(180deg, #4F46E5 0%, #818CF8 100%)',
    borderRadius: '4px 4px 0 0',
    minHeight: value > 0 ? 4 : 0,
    transition: 'height 0.3s',
  }),
  barLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center', whiteSpace: 'nowrap' },
  barValue: { fontSize: 11, color: '#374151', fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#F9FAFB', padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB' },
  td: { padding: '8px 12px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6' },
  loading: { textAlign: 'center', padding: 60, color: '#6B7280', gridColumn: '1 / -1' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, gridColumn: '1 / -1' },
  empty: { textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 12 },
  fullCard: { background: '#FFF', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: '1 / -1' },
  statRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statItem: { flex: 1, minWidth: 120, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, textAlign: 'center' },
  statVal: { fontSize: 24, fontWeight: 700, color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomeData, setIncomeData] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [teacherStats, setTeacherStats] = useState([]);

  const token = localStorage.getItem('edu_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          axios.get(`${API_URL}/api/reports/income`, { headers }),
          axios.get(`${API_URL}/api/reports/students`, { headers }),
          axios.get(`${API_URL}/api/reports/courses`, { headers }),
          axios.get(`${API_URL}/api/reports/teachers`, { headers }),
        ]);

        if (results[0].status === 'fulfilled') {
          const d = results[0].value.data;
          setIncomeData(d.data || d.monthly || d || []);
        }
        if (results[1].status === 'fulfilled') {
          const d = results[1].value.data;
          setStudentStats(d.data || d);
        }
        if (results[2].status === 'fulfilled') {
          const d = results[2].value.data;
          setCourseStats(d.data || d.courses || d || []);
        }
        if (results[3].status === 'fulfilled') {
          const d = results[3].value.data;
          setTeacherStats(d.data || d.teachers || d || []);
        }

        const failedCount = results.filter(r => r.status === 'rejected').length;
        if (failedCount === results.length) {
          setError('所有报表接口加载失败，请检查后端服务');
        }
      } catch (err) {
        setError(err.message || '加载报表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return <div style={styles.loading}>⏳ 加载报表数据...</div>;
  }

  // Income chart data
  const maxIncome = Math.max(...incomeData.map(d => d.amount || 0), 1);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📈 数据报表</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {/* 月度收入趋势 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💰 月度收入趋势</h3>
          {incomeData.length > 0 ? (
            <div style={styles.barChart}>
              {incomeData.map((d, i) => (
                <div key={i} style={styles.barWrapper}>
                  <div style={styles.barValue}>¥{(d.amount || 0).toLocaleString()}</div>
                  <div style={styles.bar(d.amount || 0, maxIncome)} />
                  <div style={styles.barLabel}>{d.month || d.label || ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.empty}>暂无数据</div>
          )}
        </div>

        {/* 学员统计 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👤 学员统计</h3>
          {studentStats ? (
            <>
              <div style={styles.statRow}>
                <div style={styles.statItem}>
                  <div style={styles.statVal}>{studentStats.total || 0}</div>
                  <div style={styles.statLabel}>总学员</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statVal}>{studentStats.active || 0}</div>
                  <div style={styles.statLabel}>在读</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statVal}>{studentStats.newThisMonth || 0}</div>
                  <div style={styles.statLabel}>本月新增</div>
                </div>
              </div>
              {studentStats.byGrade && studentStats.byGrade.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>按年级分布</div>
                  {studentStats.byGrade.map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
                      <span style={{ width: 60, color: '#6B7280' }}>{g.grade || g.name}</span>
                      <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 8 }}>
                        <div style={{
                          width: `${(g.count / Math.max(studentStats.total, 1)) * 100}%`,
                          background: '#4F46E5',
                          height: '100%',
                          borderRadius: 4,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', color: '#374151' }}>{g.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={styles.empty}>暂无数据</div>
          )}
        </div>

        {/* 课程统计 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📚 课程统计</h3>
          {courseStats.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>课程</th>
                  <th style={styles.th}>学员数</th>
                  <th style={styles.th}>排课数</th>
                </tr>
              </thead>
              <tbody>
                {courseStats.map((c, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{c.name || c.course_name}</td>
                    <td style={styles.td}>{c.studentCount || 0}</td>
                    <td style={styles.td}>{c.scheduleCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>暂无数据</div>
          )}
        </div>

        {/* 教师课时统计 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👨‍🏫 教师课时统计</h3>
          {teacherStats.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>教师</th>
                  <th style={styles.th}>课时数</th>
                  <th style={styles.th}>学生数</th>
                </tr>
              </thead>
              <tbody>
                {teacherStats.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.name || t.teacher_name}</td>
                    <td style={styles.td}>{t.hours || t.lessonCount || 0}</td>
                    <td style={styles.td}>{t.studentCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
