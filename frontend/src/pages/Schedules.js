import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
  '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00',
];

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  btn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 },
  dayColumn: { minWidth: 0 },
  dayHeader: { textAlign: 'center', padding: '10px 0', background: '#4F46E5', color: '#FFF', borderRadius: '8px 8px 0 0', fontSize: 14, fontWeight: 600 },
  dayItems: { background: '#FFF', borderRadius: '0 0 8px 8px', minHeight: 120, padding: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  scheduleItem: { padding: '8px 10px', borderRadius: 6, marginBottom: 6, fontSize: 12, borderLeft: '3px solid', background: '#F9FAFB' },
  conflict: { background: '#FEF2F2', borderLeftColor: '#EF4444 !important', color: '#DC2626' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { background: '#FFF', borderRadius: 12, padding: 28, width: '90%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' },
  modalTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FFF' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  cancelBtn: { padding: '8px 18px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#FFF', color: '#374151', cursor: 'pointer', fontSize: 13 },
  saveBtn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  loading: { textAlign: 'center', padding: 60, color: '#6B7280' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, marginBottom: 16 },
  conflictWarn: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', color: '#92400E', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  empty: { textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 12 },
  actionBtn: (color) => ({
    padding: '3px 8px', border: `1px solid ${color}`, borderRadius: 4, background: 'transparent',
    color, cursor: 'pointer', fontSize: 11,
  }),
};

const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ courseId: '', teacherId: '', weekday: '1', timeSlot: '', classroom: '' });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [schRes, courRes, teaRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedules`, { headers }),
        axios.get(`${API_URL}/api/courses`, { headers, params: { limit: 100 } }),
        axios.get(`${API_URL}/api/teachers`, { headers, params: { limit: 100 } }),
      ]);
      setSchedules(schRes.data.data || schRes.data.schedules || schRes.data || []);
      setCourses(courRes.data.data || courRes.data.courses || []);
      setTeachers(teaRes.data.data || teaRes.data.teachers || []);
    } catch (err) {
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const checkConflict = (weekday, timeSlot, excludeId) => {
    return schedules.find(s =>
      s.weekday === weekday && s.timeSlot === timeSlot && (s.id || s._id) !== excludeId
    );
  };

  const handleSave = async () => {
    if (!form.courseId || !form.teacherId || !form.timeSlot) {
      alert('请填写完整信息');
      return;
    }
    const conflicting = checkConflict(form.weekday, form.timeSlot, null);
    if (conflicting) {
      setConflict(`时间冲突：该时段已有排课「${conflicting.courseName || '课程'}」（${conflicting.teacherName || '教师'}）`);
      return;
    }
    setConflict('');
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/schedules`, form, { headers });
      setShowModal(false);
      setForm({ courseId: '', teacherId: '', weekday: '1', timeSlot: '', classroom: '' });
      fetchAll();
    } catch (err) {
      if (err.response?.data?.message?.includes('冲突')) {
        setConflict(err.response.data.message);
      } else {
        alert(err.response?.data?.message || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('确认删除此排课？')) return;
    try {
      await axios.delete(`${API_URL}/api/schedules/${item.id || item._id}`, { headers });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  // Group by weekday
  const grouped = {};
  WEEKDAYS.forEach((_, i) => { grouped[i + 1] = []; });
  schedules.forEach((s) => {
    const day = s.weekday || 1;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(s);
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>排课管理</h2>
        <button style={styles.btn} onClick={() => { setConflict(''); setShowModal(true); }}>+ 新增排课</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ 加载中...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ ...styles.weekGrid, minWidth: 700 }}>
            {WEEKDAYS.map((day, idx) => {
              const dayNum = idx + 1;
              return (
                <div key={dayNum} style={styles.dayColumn}>
                  <div style={styles.dayHeader}>{day}</div>
                  <div style={styles.dayItems}>
                    {grouped[dayNum].length === 0 ? (
                      <div style={styles.empty}>暂无</div>
                    ) : (
                      grouped[dayNum].map((s, i) => (
                        <div
                          key={s.id || s._id}
                          style={{
                            ...styles.scheduleItem,
                            borderLeftColor: colors[i % colors.length],
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.courseName || '课程'}</div>
                          <div style={{ color: '#6B7280' }}>{s.teacherName || '教师'}</div>
                          <div style={{ color: '#6B7280' }}>{s.timeSlot || ''}</div>
                          {s.classroom && <div style={{ color: '#9CA3AF' }}>📍 {s.classroom}</div>}
                          <button
                            style={{ ...styles.actionBtn('#EF4444'), marginTop: 4 }}
                            onClick={() => handleDelete(s)}
                          >
                            删除
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>新增排课</h3>

            {conflict && <div style={styles.conflictWarn}>⚠️ {conflict}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>课程 *</label>
              <select style={styles.select} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">请选择课程</option>
                {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>教师 *</label>
              <select style={styles.select} value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">请选择教师</option>
                {teachers.map((t) => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>星期 *</label>
                <select style={styles.select} value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
                  {WEEKDAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>时间段 *</label>
                <select style={styles.select} value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
                  <option value="">请选择</option>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>教室</label>
              <input style={styles.input} placeholder="例如：A101" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
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
