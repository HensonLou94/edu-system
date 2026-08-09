import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  btn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  card: { background: '#FFF', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #4F46E5' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 },
  cardMeta: { fontSize: 12, color: '#6B7280', marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 4 },
  cardContent: { fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  deadline: (expired) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: expired ? '#FEF2F2' : '#ECFDF5',
    color: expired ? '#DC2626' : '#059669',
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
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', minHeight: 120, resize: 'vertical', fontFamily: 'inherit' },
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

export default function Homework() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', content: '', deadline: '' });

  const token = localStorage.getItem('edu_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/courses`, { headers, params: { limit: 100 } });
        setCourses(res.data.data || res.data.courses || []);
      } catch (e) { console.error(e); }
    };
    loadCourses();
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/homework`, { headers, params: { page, limit: 10 } });
      setList(res.data.data || res.data.homework || []);
      setTotal(res.data.total || res.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSave = async () => {
    if (!form.courseId || !form.title) { alert('请选择课程并填写标题'); return; }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/homework`, form, { headers });
      setShowModal(false);
      setForm({ courseId: '', title: '', content: '', deadline: '' });
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('确认删除此作业？')) return;
    try {
      await axios.delete(`${API_URL}/api/homework/${item.id || item._id}`, { headers });
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>作业管理</h2>
        <button style={styles.btn} onClick={() => setShowModal(true)}>+ 新增作业</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ 加载中...</div>
      ) : list.length === 0 ? (
        <div style={styles.empty}>暂无作业</div>
      ) : (
        <>
          {list.map((hw) => (
            <div key={hw.id || hw._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{hw.title}</h3>
                <div>
                  <button style={styles.actionBtn('#EF4444')} onClick={() => handleDelete(hw)}>删除</button>
                </div>
              </div>
              <div style={styles.cardMeta}>
                <span style={styles.metaItem}>📚 {hw.courseName || '未指定课程'}</span>
                <span style={styles.metaItem}>📅 {hw.createdAt ? new Date(hw.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
                {hw.deadline && (
                  <span style={styles.deadline(isExpired(hw.deadline))}>
                    截止: {new Date(hw.deadline).toLocaleDateString('zh-CN')}
                    {isExpired(hw.deadline) ? ' (已过期)' : ''}
                  </span>
                )}
              </div>
              {hw.content && (
                <div style={styles.cardContent}>{hw.content}</div>
              )}
            </div>
          ))}

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
            <h3 style={styles.modalTitle}>新增作业</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>课程 *</label>
              <select style={styles.select} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">请选择课程</option>
                {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>作业标题 *</label>
              <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：第三章课后练习" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>作业内容</label>
              <textarea style={styles.textarea} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="详细描述作业要求..." />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>截止日期</label>
              <input style={styles.input} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
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
