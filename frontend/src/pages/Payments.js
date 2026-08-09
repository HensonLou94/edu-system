import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const methodLabels = { cash: '现金', wechat: '微信', alipay: '支付宝' };
const typeLabels = { tuition: '学费', material: '材料费', other: '其他', refund: '退款' };
const statusLabels = { paid: '已收', pending: '待收', refunded: '已退' };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const limit = 15;

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/payments', { headers: headers(), params: { page, limit } }),
      axios.get('/api/payments/summary', { headers: headers() }),
    ]).then(([pRes, sRes]) => {
      setPayments(pRes.data.payments); setTotal(pRes.data.total);
      setSummary(sRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = async () => {
    setForm({ student_id: '', course_id: '', amount: '', payment_method: 'cash', payment_type: 'tuition', payment_date: new Date().toISOString().slice(0, 10), notes: '' });
    setErrors({});
    try {
      const [sRes, cRes] = await Promise.all([
        axios.get('/api/students', { headers: headers(), params: { page: 1, limit: 1000 } }),
        axios.get('/api/courses/all', { headers: headers() }),
      ]);
      setStudents(sRes.data.students || []);
      setCourses(cRes.data || []);
    } catch (e) {}
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.student_id) e.student_id = '请选择学员';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = '请输入有效金额';
    if (!form.payment_date) e.payment_date = '请选择日期';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.post('/api/payments', { ...form, amount: parseFloat(form.amount) }, { headers: headers() });
      setModal(false);
      fetchData();
    } catch (err) {
      setErrors({ _submit: err.response?.data?.error || '操作失败' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">收费管理</h1>
          <p className="page-subtitle">共 {total} 条记录</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ 新增收费</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>📊</div>
            <div className="value">{summary.count || 0}</div>
            <div className="label">收费笔数</div>
          </div>
          <div className="stat-card">
            <div className="icon" style={{ background: '#F0FDF4', color: '#10B981' }}>💰</div>
            <div className="value">¥{(Number(summary.total_amount) || 0).toLocaleString()}</div>
            <div className="label">总金额</div>
          </div>
          <div className="stat-card">
            <div className="icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>💵</div>
            <div className="value">¥{(Number(summary.cash_amount) || 0).toLocaleString()}</div>
            <div className="label">现金</div>
          </div>
          <div className="stat-card">
            <div className="icon" style={{ background: '#D1FAE5', color: '#059669' }}>📱</div>
            <div className="value">¥{(Number(summary.wechat_amount) || 0).toLocaleString()}</div>
            <div className="label">微信</div>
          </div>
          <div className="stat-card">
            <div className="icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>💳</div>
            <div className="value">¥{(Number(summary.alipay_amount) || 0).toLocaleString()}</div>
            <div className="label">支付宝</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>收据号</th>
                <th>学员</th>
                <th>课程</th>
                <th>金额</th>
                <th>方式</th>
                <th>类型</th>
                <th>日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="icon">💰</div><div className="text">暂无收费记录</div></div></td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.receipt_no}</td>
                    <td style={{ fontWeight: 500 }}>{p.student_name || '-'}</td>
                    <td>{p.course_name || '-'}</td>
                    <td style={{ fontWeight: 600, color: p.amount < 0 ? 'var(--danger)' : 'var(--primary)' }}>
                      {p.amount < 0 ? '-' : ''}¥{Math.abs(Number(p.amount) || 0).toLocaleString()}
                    </td>
                    <td><span className="badge badge-gray">{methodLabels[p.payment_method] || p.payment_method}</span></td>
                    <td><span className="badge badge-primary">{typeLabels[p.payment_type] || p.payment_type}</span></td>
                    <td>{p.payment_date?.slice(0, 10)}</td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'refunded' ? 'badge-danger' : 'badge-warning'}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
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
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新增收费</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {errors._submit && <div className="alert alert-error">⚠️ {errors._submit}</div>}
              <div className="form-group">
                <label className="form-label">学员 *</label>
                <select className={`form-select ${errors.student_id ? 'error' : ''}`} value={form.student_id || ''} onChange={e => setForm({...form, student_id: e.target.value})}>
                  <option value="">请选择学员</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_no})</option>)}
                </select>
                {errors.student_id && <div className="form-error">{errors.student_id}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">课程</label>
                <select className="form-select" value={form.course_id || ''} onChange={e => setForm({...form, course_id: e.target.value})}>
                  <option value="">请选择课程（可选）</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">金额 *</label>
                  <input type="number" className={`form-input ${errors.amount ? 'error' : ''}`} value={form.amount || ''} onChange={e => setForm({...form, amount: e.target.value})} step="0.01" />
                  {errors.amount && <div className="form-error">{errors.amount}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">收费日期 *</label>
                  <input type="date" className={`form-input ${errors.payment_date ? 'error' : ''}`} value={form.payment_date || ''} onChange={e => setForm({...form, payment_date: e.target.value})} />
                  {errors.payment_date && <div className="form-error">{errors.payment_date}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">收费方式</label>
                  <select className="form-select" value={form.payment_method || 'cash'} onChange={e => setForm({...form, payment_method: e.target.value})}>
                    <option value="cash">现金</option>
                    <option value="wechat">微信</option>
                    <option value="alipay">支付宝</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">收费类型</label>
                  <select className="form-select" value={form.payment_type || 'tuition'} onChange={e => setForm({...form, payment_type: e.target.value})}>
                    <option value="tuition">学费</option>
                    <option value="material">材料费</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea className="form-textarea" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>取消</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? '保存中...' : '确认收费'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
