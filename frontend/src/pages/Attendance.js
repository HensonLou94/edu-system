import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Attendance() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Load schedules
  useEffect(() => {
    axios.get('/api/schedules', { headers: headers(), params: { page: 1, limit: 100 } })
      .then(res => setSchedules(res.data.schedules || []))
      .catch(() => {});
  }, []);

  // Load students when schedule selected
  const loadStudents = useCallback((scheduleId) => {
    if (!scheduleId) { setStudents([]); setRecords({}); return; }
    setLoading(true);
    axios.get(`/api/attendance/students/${scheduleId}`, { headers: headers() })
      .then(res => {
        setStudents(res.data || []);
        const init = {};
        (res.data || []).forEach(s => { init[s.id] = { status: 'present', notes: '' }; });
        setRecords(init);
      })
      .catch(() => { setStudents([]); setRecords({}); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStudents(selectedSchedule); }, [selectedSchedule, loadStudents]);

  const updateRecord = (studentId, field, value) => {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSubmit = async () => {
    if (!selectedSchedule) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const recordsList = Object.entries(records).map(([studentId, rec]) => ({
        student_id: parseInt(studentId),
        status: rec.status,
        notes: rec.notes || null,
      }));
      await axios.post('/api/attendance', {
        schedule_id: parseInt(selectedSchedule),
        class_date: todayDate,
        records: recordsList,
      }, { headers: headers() });
      setMessage({ type: 'success', text: '签到提交成功！' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '提交失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const selected = schedules.find(s => String(s.id) === String(selectedSchedule));
  const presentCount = Object.values(records).filter(r => r.status === 'present' || r.status === 'late').length;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">签到考勤</h1>
          <p className="page-subtitle">{todayDate}</p>
        </div>
      </div>

      {/* Schedule Selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">选择课程</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ maxWidth: 400 }}
              value={selectedSchedule || ''}
              onChange={e => setSelectedSchedule(e.target.value)}
            >
              <option value="">请选择排课...</option>
              {schedules.filter(s => s.status === 'active').map(s => (
                <option key={s.id} value={s.id}>
                  {s.day_name || `周${s.day_of_week}`} {s.start_time}-{s.end_time} | {s.course_name} | {s.teacher_name} | {s.classroom || '未分配'}
                </option>
              ))}
            </select>
            {selected && (
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-500)' }}>
                <span>📚 {selected.course_name}</span>
                <span>👨‍🏫 {selected.teacher_name}</span>
                <span>👥 {students.length} 人</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      {selectedSchedule && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">签到列表</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                已签 {presentCount}/{students.length}
              </span>
              <button className="btn btn-primary" disabled={submitting || students.length === 0} onClick={handleSubmit}>
                {submitting ? '提交中...' : '提交签到'}
              </button>
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px 20px' }}>
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
              </div>
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>编号</th>
                  <th>姓名</th>
                  <th>家长电话</th>
                  <th>状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                  ))
                ) : students.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><div className="icon">📭</div><div className="text">该课程暂无报名学员</div></div></td></tr>
                ) : (
                  students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.student_no}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td>{s.parent_phone}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { value: 'present', label: '出勤', cls: 'badge-success' },
                            { value: 'late', label: '迟到', cls: 'badge-warning' },
                            { value: 'absent', label: '缺勤', cls: 'badge-danger' },
                            { value: 'leave', label: '请假', cls: 'badge-gray' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              className={`btn btn-sm ${records[s.id]?.status === opt.value ? opt.cls : 'btn-secondary'}`}
                              style={{ fontSize: 12, padding: '3px 10px' }}
                              onClick={() => updateRecord(s.id, 'status', opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          style={{ width: 160, padding: '4px 8px', fontSize: 12 }}
                          placeholder="备注..."
                          value={records[s.id]?.notes || ''}
                          onChange={e => updateRecord(s.id, 'notes', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
