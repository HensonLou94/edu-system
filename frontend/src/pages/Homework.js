import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Homework() {
  const [homework, setHomework] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const limit = 15;

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get('/api/homework', { headers: headers(), params: { page, limit } })
      .then(res => { setHomework(res.data.homework); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = async () => {
    setForm({ course_id: '', teacher_id: '', title: '', content: '', due_date: '' });
    setErrors({});
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get('/api/courses/all', { headers: headers() }),
        axios.get('/api/teachers/all', { headers: headers() }),
      ]);
      setCourses(cRes.data || []);
      setTeachers(tRes.data || []);
    } catch (e) {}
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.course_id) e.course_id = '请选择课程';
    if (!form.teacher_id) e.teacher_id = '请选择教师';
    if (!form.title?.trim()) e.title = '必填';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post('/api/homework', form, { headers: headers() });
      setModal(false);
      fetchData();
    } catch (err) {
      setErrors({ _submit: err.response?.data?.error || '操作失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该作业？')) return;
    try { await axios.delete(`/api/homework/${id}`, { headers: headers() }); fetchData(); }
    catch (err) { alert(err.response?.data?.error || '删除失败'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">作业管理</h1>
          <p className="page-subtitle">共 {total} 条作业</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 发布作业</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>课程</th>
                <th>科目</th>
                <th>教师</th>
                <th>截止日期</th>
                <th>发布日期</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                ))
              ) : homework.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">📝</div><div className="text">暂无作业</div></div></td></tr>
              ) : (
                homework.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 500 }}>{h.title}</td>
                    <td>{h.course_name}</td>
                    <td><span className="badge badge-primary">{h.subject || '-'}</span></td>
                    <td>{h.teacher_name}</td>
                    <td>
                      {h.due_date ? (
                        <span className={`badge ${new Date(h.due_date) < new Date() ? 'badge-danger' : 'badge-warning'}`}>
                          {h.due_date.slice(0, 10)}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{h.created_at?.slice(0, 10)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.id)}>删除</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination" style={{ padding: '12px 16px' }}>
            <span className="pagination-info">第 {page}/{totalPages} 页</span>
            <div className="pagination-buttons">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">发布作业</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {errors._submit && <div className="alert alert-error">⚠️ {errors._submit}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">课程 *</label>
                  <select className={`form-select ${errors.course_id ? 'error' : ''}`} value={form.course_id || ''} onChange={e => setForm({...form, course_id: e.target.value})}>
                    <option value="">请选择课程</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.course_id && <div className="form-error">{errors.course_id}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">教师 *</label>
                  <select className={`form-select ${errors.teacher_id ? 'error' : ''}`} value={form.teacher_id || ''} onChange={e => setForm({...form, teacher_id: e.target.value})}>
                    <option value="">请选择教师</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {errors.teacher_id && <div className="form-error">{errors.teacher_id}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">标题 *</label>
                <input className={`form-input ${errors.title ? 'error' : ''}`} value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} placeholder="作业标题" />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">作业内容</label>
                <textarea className="form-textarea" style={{ minHeight: 120 }} value={form.content || ''} onChange={e => setForm({...form, content: e.target.value})} placeholder="详细描述作业要求..." />
              </div>
              <div className="form-group">
                <label className="form-label">截止日期</label>
                <input type="date" className="form-input" value={form.due_date || ''} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>取消</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? '发布中...' : '发布作业'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
