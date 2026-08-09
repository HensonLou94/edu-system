import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  btn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: '#FFF', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#111827' },
  filterBar: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 12, color: '#6B7280', fontWeight: 500 },
  select: { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFF', minWidth: 140 },
  dateInput: { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#FFF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { background: '#F9FAFB', padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6' },
  badge: (type) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: type === 'cash' ? '#ECFDF5' : type === 'wechat' ? '#EFF6FF' : type === 'alipay' ? '#EEF2FF' : '#F3F4F6',
    color: type === 'cash' ? '#059669' : type === 'wechat' ? '#2563EB' : type === 'alipay' ? '#4F46E5' : '#374151',
  }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: '#FFF', borderRadius: 12, padding: 28, width: '90%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelBtn: { padding: '8px 18px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFF', color: '#374151', cursor: 'pointer', fontSize: 13 },
  saveBtn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  loading: { textAlign: 'center', padding: 60, color: '#6B7280' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, marginBottom: 16 },
  empty: { textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
  pageBtn: (active) => ({
    padding: '6px 12px', border: '1px solid', borderRadius: 6, cursor: 'pointer', fontSize: 13,
    borderColor: active ? '#4F46E5' : '#D1D5DB',
    background: active ? '#4F46E5' : '#FFF',
    color: active ? '#FFF' : '#374151',
  }),
};

const payMethods = [
  { value: 'cash', label: '现金' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'bank', label: '银行转账' },
];

const methodLabels = { cash: '现金', wechat: '微信', alipay: '支付宝', bank: '银行转账' };

export default function Payments() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ studentId: '', courseId: '', amount: '', method: 'wechat', remark: '', date: new Date().toISOString().split('T')[0] });

  const token = localStorage.getItem('edu_token');
  const headers = { Authorization: `Bearer ${token}` };

  // Load students & courses for form
  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          axios.get(`${API_URL}/api/students`, { headers, params: { limit: 500 } }),
          axios.get(`${API_URL}/api/courses`, { headers, params: { limit: 500 } }),
        ]);
        setStudents(sRes.data.data || sRes.data.students || []);
        setCourses(cRes.data.data || cRes.data.courses || []);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (filterCourse) params.courseId = filterCourse;
      if (filterMethod) params.method = filterMethod;
      const res = await axios.get(`${API_URL}/api/payments`, { headers, params });
      setList(res.data.data || res.data.payments || []);
      setTotal(res.data.total || res.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, filterCourse, filterMethod]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSave = async () => {
    if (!form.studentId || !form.courseId || !form.amount) {
      alert('请填写完整信息');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/payments`, { ...form, amount: Number(form.amount) }, { headers });
      setShowModal(false);
      setForm({ studentId: '', courseId: '', amount: '', method: 'wechat', remark: '', date: new Date().toISOString().split('T')[0] });
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>收费管理</h2>
        <button style={styles.btn} onClick={() => setShowModal(true)}>+ 新增收费</button>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>总收入</div>
          <div style={styles.statValue}>¥{list.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>记录总数</div>
          <div style={styles.statValue}>{total}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>当前页记录</div>
          <div style={styles.statValue}>{list.length}</div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>课程筛选</span>
          <select style={styles.select} value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}>
            <option value="">全部课程</option>
            {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>支付方式</span>
          <select style={styles.select} value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}>
            <option value="">全部方式</option>
            {payMethods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ 加载中...</div>
      ) : list.length === 0 ? (
        <div style={styles.empty}>暂无收费记录</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>日期</th>
                  <th style={styles.th}>学员</th>
                  <th style={styles.th}>课程</th>
                  <th style={styles.th}>金额</th>
                  <th style={styles.th}>支付方式</th>
                  <th style={styles.th}>备注</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id || p._id}>
                    <td style={styles.td}>{p.date ? new Date(p.date).toLocaleDateString('zh-CN') : '-'}</td>
                    <td style={styles.td}>{p.studentName || '-'}</td>
                    <td style={styles.td}>{p.courseName || '-'}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#059669' }}>¥{(p.amount || 0).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(p.method)}>{methodLabels[p.method] || p.method}</span>
                    </td>
                    <td style={styles.td}>{p.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.pagination}>
            <button style={styles.pageBtn(false)} disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
            <span style={{ fontSize: 13, color: '#6B7280' }}>第 {page} / {totalPages} 页（共 {total} 条）</span>
            <button style={styles.pageBtn(false)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        </>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>新增收费</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>学员 *</label>
              <select style={styles.select} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">请选择学员</option>
                {students.map((s) => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>课程 *</label>
              <select style={styles.select} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">请选择课程</option>
                {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>金额（元） *</label>
                <input style={styles.input} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>支付方式</label>
                <select style={styles.select} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {payMethods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>日期</label>
              <input style={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>备注</label>
              <input style={styles.input} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
              <button style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
