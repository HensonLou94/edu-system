import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const gradeOptions = ['一年级','二年级','三年级','四年级','五年级','六年级','初一','初二','初三','高一','高二','高三'];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | editObj
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const limit = 15;

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get('/api/students', { headers: headers(), params: { page, limit, keyword } })
      .then(res => { setStudents(res.data.students); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setForm({ name: '', gender: 'male', parent_name: '', parent_phone: '', grade: '', phone: '', school: '', notes: '' }); setErrors({}); setModal('add'); };
  const openEdit = (s) => { setForm({ ...s }); setErrors({}); setModal(s); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = '必填';
    if (!form.parent_name?.trim()) e.parent_name = '必填';
    if (!form.parent_phone?.trim()) e.parent_phone = '必填';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/students', form, { headers: headers() });
      } else {
        await axios.put(`/api/students/${modal.id}`, form, { headers: headers() });
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
    if (!window.confirm('确认删除该学员？')) return;
    try {
      await axios.delete(`/api/students/${id}`, { headers: headers() });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">学员管理</h1>
          <p className="page-subtitle">共 {total} 名学员</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 新增学员</button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="icon">🔍</span>
              <input
                className="form-input"
                placeholder="搜索姓名、家长姓名、电话..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>编号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>年级</th>
                <th>家长姓名</th>
                <th>家长电话</th>
                <th>学校</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="icon">📭</div><div className="text">暂无学员数据</div></div></td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.student_no}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><span className={`badge ${s.gender === 'male' ? 'badge-primary' : 'badge-danger'}`}>{s.gender === 'male' ? '男' : '女'}</span></td>
                    <td>{s.grade || '-'}</td>
                    <td>{s.parent_name}</td>
                    <td>{s.parent_phone}</td>
                    <td>{s.school || '-'}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{s.status === 'active' ? '在读' : '休学'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>删除</button>
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

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? '新增学员' : '编辑学员'}</span>
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
                  <label className="form-label">性别</label>
                  <select className="form-select" value={form.gender || 'male'} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">年级</label>
                  <select className="form-select" value={form.grade || ''} onChange={e => setForm({...form, grade: e.target.value})}>
                    <option value="">请选择</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">学校</label>
                  <input className="form-input" value={form.school || ''} onChange={e => setForm({...form, school: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">家长姓名 *</label>
                  <input className={`form-input ${errors.parent_name ? 'error' : ''}`} value={form.parent_name || ''} onChange={e => setForm({...form, parent_name: e.target.value})} />
                  {errors.parent_name && <div className="form-error">{errors.parent_name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">家长电话 *</label>
                  <input className={`form-input ${errors.parent_phone ? 'error' : ''}`} value={form.parent_phone || ''} onChange={e => setForm({...form, parent_phone: e.target.value})} />
                  {errors.parent_phone && <div className="form-error">{errors.parent_phone}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">学员电话</label>
                  <input className="form-input" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select className="form-select" value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">在读</option>
                    <option value="inactive">休学</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea className="form-textarea" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
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
