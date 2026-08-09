import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const DAYS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const limit = 15;

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/schedules', { headers: headers(), params: { page, limit } }),
      axios.get('/api/courses/all', { headers: headers() }),
      axios.get('/api/teachers/all', { headers: headers() }),
    ]).then(([sRes, cRes, tRes]) => {
      setSchedules(sRes.data.schedules); setTotal(sRes.data.total);
      setCourses(cRes.data); setTeachers(tRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setForm({ course_id: '', teacher_id: '', classroom: '', day_of_week: 1, start_time: '09:00', end_time: '10:30', max_students: 30 });
    setErrors({}); setModal('add');
  };

  const validate = () => {
    const e = {};
    if (!form.course_id) e.course_id = '请选择课程';
    if (!form.teacher_id) e.teacher_id = '请选择教师';
    if (!form.day_of_week) e.day_of_week = '请选择星期';
    if (!form.start_time) e.start_time = '必填';
    if (!form.end_time) e.end_time = '必填';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') {
        await axios.post('/api/schedules', form, { headers: headers() });
      } else {
        await axios.put(`/api/schedules/${modal.id}`, { ...form, status: form.status || 'active' }, { headers: headers() });
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      setErrors({ _submit: err.response?.data?.error || '操作失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该排课？')) return;
    try { await axios.delete(`/api/schedules/${id}`, { headers: headers() }); fetchAll(); }
    catch (err) { alert(err.response?.data?.error || '删除失败'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">排课管理</h1>
          <p className="page-subtitle">共 {total} 条排课</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 新增排课</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>课程</th>
                <th>科目</th>
                <th>教师</th>
                <th>教室</th>
                <th>星期</th>
                <th>时间</th>
                <th>人数上限</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(9)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                ))
              ) : schedules.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="icon">📅</div><div className="text">暂无排课</div></div></td></tr>
              ) : (
                schedules.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.course_name}</td>
                    <td><span className="badge badge-primary">{s.subject || '-'}</span></td>
                    <td>{s.teacher_name}</td>
                    <td>{s.classroom || '-'}</td>
                    <td><span className="badge badge-warning">{s.day_name || DAYS[s.day_of_week]}</span></td>
                    <td>{s.start_time} - {s.end_time}</td>
                    <td>{s.max_students || 30}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{s.status === 'active' ? '正常' : '已停'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setForm({ ...s }); setErrors({}); setModal(s); }}>编辑</button>
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

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? '新增排课' : '编辑排课'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {errors._submit && <div className="alert alert-error">⚠️ {errors._submit}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">课程 *</label>
                  <select className={`form-select ${errors.course_id ? 'error' : ''}`} value={form.course_id || ''} onChange={e => setForm({...form, course_id: e.target.value})}>
                    <option value="">请选择课程</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.subject})</option>)}
                  </select>
                  {errors.course_id && <div className="form-error">{errors.course_id}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">教师 *</label>
                  <select className={`form-select ${errors.teacher_id ? 'error' : ''}`} value={form.teacher_id || ''} onChange={e => setForm({...form, teacher_id: e.target.value})}>
                    <option value="">请选择教师</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subjects || '-'})</option>)}
                  </select>
                  {errors.teacher_id && <div className="form-error">{errors.teacher_id}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">教室</label>
                  <input className="form-input" value={form.classroom || ''} onChange={e => setForm({...form, classroom: e.target.value})} placeholder="如：A101" />
                </div>
                <div className="form-group">
                  <label className="form-label">星期 *</label>
                  <select className={`form-select ${errors.day_of_week ? 'error' : ''}`} value={form.day_of_week || ''} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})}>
                    {DAYS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                  </select>
                  {errors.day_of_week && <div className="form-error">{errors.day_of_week}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">开始时间 *</label>
                  <input type="time" className={`form-input ${errors.start_time ? 'error' : ''}`} value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} />
                  {errors.start_time && <div className="form-error">{errors.start_time}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间 *</label>
                  <input type="time" className={`form-input ${errors.end_time ? 'error' : ''}`} value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} />
                  {errors.end_time && <div className="form-error">{errors.end_time}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">人数上限</label>
                <input type="number" className="form-input" value={form.max_students || 30} onChange={e => setForm({...form, max_students: parseInt(e.target.value) || 30})} />
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
