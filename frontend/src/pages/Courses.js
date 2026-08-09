import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const subjects = ['数学','语文','英语','物理','化学','生物','历史','地理','政治','美术','音乐','体育','编程','其他'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const limit = 15;

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get('/api/courses', { headers: headers(), params: { page, limit } })
      .then(res => { setCourses(res.data.courses); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm({ name: '', subject: '数学', grade_level: '', description: '', total_hours: 0, price: 0 }); setErrors({}); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c }); setErrors({}); setModal(c); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = '必填';
    if (!form.subject) e.subject = '必填';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/courses', form, { headers: headers() });
      } else {
        await axios.put(`/api/courses/${modal.id}`, form, { headers: headers() });
      }
      setModal(null);
      fetchData();
    } catch (err) {
      setErrors({ _submit: err.response?.data?.error || '操作失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该课程？')) return;
    try {
      await axios.delete(`/api/courses/${id}`, { headers: headers() });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || '删除失败'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">课程管理</h1>
          <p className="page-subtitle">共 {total} 门课程</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 新增课程</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>课程名称</th>
                <th>科目</th>
                <th>年级</th>
                <th>总课时</th>
                <th>价格</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                ))
              ) : courses.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">📚</div><div className="text">暂无课程</div></div></td></tr>
              ) : (
                courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><span className="badge badge-primary">{c.subject}</span></td>
                    <td>{c.grade_level || '-'}</td>
                    <td>{c.total_hours || 0} 课时</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>¥{Number(c.price || 0).toLocaleString()}</td>
                    <td><span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{c.status === 'active' ? '开课中' : '已停课'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>删除</button>
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
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? '新增课程' : '编辑课程'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {errors._submit && <div className="alert alert-error">⚠️ {errors._submit}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">课程名称 *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">科目 *</label>
                  <select className={`form-select ${errors.subject ? 'error' : ''}`} value={form.subject || ''} onChange={e => setForm({...form, subject: e.target.value})}>
                    <option value="">请选择</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <div className="form-error">{errors.subject}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">年级</label>
                  <input className="form-input" value={form.grade_level || ''} onChange={e => setForm({...form, grade_level: e.target.value})} placeholder="如：三年级" />
                </div>
                <div className="form-group">
                  <label className="form-label">价格（元）</label>
                  <input type="number" className="form-input" value={form.price || ''} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">总课时</label>
                <input type="number" className="form-input" value={form.total_hours || ''} onChange={e => setForm({...form, total_hours: parseInt(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">课程描述</label>
                <textarea className="form-textarea" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>取消</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
