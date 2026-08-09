import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  btn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#FFF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { background: '#F9FAFB', padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6' },
  badge: (active) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: active ? '#ECFDF5' : '#FEF2F2',
    color: active ? '#059669' : '#DC2626',
  }),
  actionBtn: (color) => ({
    padding: '4px 10px', border: `1px solid ${color}`, borderRadius: 6, background: 'transparent',
    color, cursor: 'pointer', fontSize: 12, marginRight: 6,
  }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: '#FFF', borderRadius: 12, padding: 28, width: '90%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FFF' },
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

const emptyForm = { name: '', subject: '', grade: '', hours: '', price: '', status: 'active', description: '' };
const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '美术', '音乐', '编程', '其他'];
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三', '不限'];

export default function Courses() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('edu_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/courses`, { headers, params: { page, limit: 10 } });
      setList(res.data.data || res.data.courses || res.data || []);
      setTotal(res.data.total || res.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSave = async () => {
    if (!form.name || !form.subject) { alert('请填写课程名和科目'); return; }
    setSaving(true);
    try {
      const payload = { ...form, hours: Number(form.hours) || 0, price: Number(form.price) || 0 };
      if (editing) {
        await axios.put(`${API_URL}/api/courses/${editing.id || editing._id}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/api/courses`, payload, { headers });
      }
      setShowModal(false);
      setEditing(null);
      setForm({ ...emptyForm });
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`确认删除课程「${item.name}」？`)) return;
    try {
      await axios.delete(`${API_URL}/api/courses/${item.id || item._id}`, { headers });
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm, ...item }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>课程管理</h2>
        <button style={styles.btn} onClick={openAdd}>+ 新增课程</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ 加载中...</div>
      ) : list.length === 0 ? (
        <div style={styles.empty}>暂无课程数据</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>课程名</th>
                  <th style={styles.th}>科目</th>
                  <th style={styles.th}>年级</th>
                  <th style={styles.th}>课时</th>
                  <th style={styles.th}>价格</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id || c._id}>
                    <td style={styles.td}>{c.name}</td>
                    <td style={styles.td}>{c.subject}</td>
                    <td style={styles.td}>{c.grade || '-'}</td>
                    <td style={styles.td}>{c.hours || '-'}</td>
                    <td style={styles.td}>¥{c.price || 0}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(c.status === 'active')}>
                        {c.status === 'active' ? '启用' : '停用'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.actionBtn('#4F46E5')} onClick={() => openEdit(c)}>编辑</button>
                      <button style={styles.actionBtn('#EF4444')} onClick={() => handleDelete(c)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.pagination}>
            <button style={styles.pageBtn(false)} disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
            <span style={{ fontSize: 13, color: '#6B7280' }}>第 {page} / {totalPages} 页</span>
            <button style={styles.pageBtn(false)} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        </>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? '编辑课程' : '新增课程'}</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>课程名 *</label>
              <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>科目 *</label>
                <select style={styles.select} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">请选择</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>年级</label>
                <select style={styles.select} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                  <option value="">请选择</option>
                  {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>课时数</label>
                <input style={styles.input} type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>价格（元）</label>
                <input style={styles.input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>状态</label>
              <select style={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>课程描述</label>
              <input style={styles.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
