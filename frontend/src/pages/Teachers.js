import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
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
    axios.get('/api/teachers', { headers: headers(), params: { page, limit } })
      .then(res => { setTeachers(res.data.teachers); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm({ name: '', phone: '', subjects: '', specialty: '', hourly_rate: 0 }); setErrors({}); setModal('add'); };
  const openEdit = (t) => { setForm({ ...t }); setErrors({}); setModal(t); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = '必填';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/teachers', form, { headers: headers() });
      } else {
        await axios.put(`/api/teachers/${modal.id}`, form, { headers: headers() });
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
    if (!window.confirm('确认删除该教师？')) return;
    try {
      await axios.delete(`/api/teachers/${id}`, { headers: headers() });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || '删除失败'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">教师管理</h1>
          <p className="page-subtitle">共 {total} 名教师</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 新增教师</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>电话</th>
                <th>科目</th>
                <th>特长</th>
                <th>课时费</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                ))
              ) : teachers.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="icon">👨‍🏫</div><div className="text">暂无教师</div></div></td></tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td>{t.phone || '-'}</td>
                    <td><span className="badge badge-primary">{t.subjects || '-'}</span></td>
                    <td>{t.specialty || '-'}</td>
                    <td>{t.hourly_rate ? `¥${t.hourly_rate}/h` : '-'}</td>
                    <td><span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{t.status === 'active' ? '在职' : '离职'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>删除</button>
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
              <span className="modal-title">{modal === 'add' ? '新增教师' : '编辑教师'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {errors._submit && <div className="alert alert-error">⚠️ {errors._submit}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">姓名 *</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">电话</label>
                  <input className="form-input" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">科目</label>
                  <input className="form-input" value={form.subjects || ''} onChange={e => setForm({...form, subjects: e.target.value})} placeholder="如：数学、物理" />
                </div>
                <div className="form-group">
                  <label className="form-label">特长</label>
                  <input className="form-input" value={form.specialty || ''} onChange={e => setForm({...form, specialty: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">课时费（元/小时）</label>
                  <input type="number" className="form-input" value={form.hourly_rate || ''} onChange={e => setForm({...form, hourly_rate: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select className="form-select" value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">在职</option>
                    <option value="inactive">离职</option>
                  </select>
                </div>
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
