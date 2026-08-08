import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 20px 0' },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 12, color: '#6B7280', fontWeight: 500 },
  select: { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFF', minWidth: 160 },
  dateInput: { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, outline: 'none' },
  btn: { padding: '8px 18px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnSuccess: { padding: '8px 18px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#FFF', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { background: '#F9FAFB', padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151', borderBottom: '2px solid #E5E7EB' },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6' },
  statusSelect: (status) => ({
    padding: '4px 8px', borderRadius: 6, border: '1px solid', fontSize: 12, fontWeight: 500, outline: 'none', cursor: 'pointer',
    borderColor: status === 'present' ? '#10B981' : status === 'absent' ? '#EF4444' : status === 'late' ? '#F59E0B' : '#6B7280',
    background: status === 'present' ? '#ECFDF5' : status === 'absent' ? '#FEF2F2' : status === 'late' ? '#FFFBEB' : '#F3F4F6',
    color: status === 'present' ? '#059669' : status === 'absent' ? '#DC2626' : status === 'late' ? '#D97706' : '#374151',
  }),
  loading: { textAlign: 'center', padding: 60, color: '#6B7280' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13, marginBottom: 16 },
  empty: { textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 },
  statsBar: { display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: '#6B7280' },
  statItem: { display: 'flex', alignItems: 'center', gap: 4 },
  dot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }),
};

const statusLabels = {
  present: '出勤',
  absent: '缺勤',
  late: '迟到',
  leave: '请假',
};

const statusOptions = ['present', 'absent', 'late', 'leave'];

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/courses`, { headers, params: { limit: 100 } });
        setCourses(res.data.data || res.data.courses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.get(`${API_URL}/api/students`, { headers, params: { courseId: selectedCourse, limit: 200 } });
      const studentList = res.data.data || res.data.students || [];
      setStudents(studentList);
      // Init attendance map
      const map = {};
      studentList.forEach((s) => {
        map[s.id || s._id] = 'present';
      });
      setAttendanceMap(map);
    } catch (err) {
      setError(err.response?.data?.message || '加载学员失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, headers]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSubmit = async () => {
    if (!selectedCourse || students.length === 0) {
      alert('请先选择课程并加载学员');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const records = students.map((s) => ({
        studentId: s.id || s._id,
        status: attendanceMap[s.id || s._id] || 'present',
      }));
      await axios.post(`${API_URL}/api/attendance`, {
        courseId: selectedCourse,
        date: selectedDate,
        records,
      }, { headers });
      setMessage('✅ 签到已提交');
    } catch (err) {
      alert(err.response?.data?.message || '提交失败');
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = { present: 0, absent: 0, late: 0, leave: 0 };
  Object.values(attendanceMap).forEach((s) => { statusCounts[s] = (statusCounts[s] || 0) + 1; });

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>签到考勤</h2>

      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>选择课程</span>
          <select
            style={styles.select}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">{coursesLoading ? '加载中...' : '请选择课程'}</option>
            {courses.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>签到日期</span>
          <input
            type="date"
            style={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button style={styles.btnSuccess} onClick={handleSubmit} disabled={saving || students.length === 0}>
          {saving ? '提交中...' : '📝 提交签到'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {message && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', color: '#065F46', fontSize: 13, marginBottom: 16 }}>
          {message}
        </div>
      )}

      {students.length > 0 && (
        <>
          <div style={styles.statsBar}>
            <div style={styles.statItem}><span style={styles.dot('#10B981')}></span> 出勤: {statusCounts.present}</div>
            <div style={styles.statItem}><span style={styles.dot('#EF4444')}></span> 缺勤: {statusCounts.absent}</div>
            <div style={styles.statItem}><span style={styles.dot('#F59E0B')}></span> 迟到: {statusCounts.late}</div>
            <div style={styles.statItem}><span style={styles.dot('#6B7280')}></span> 请假: {statusCounts.leave}</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>序号</th>
                  <th style={styles.th}>学员姓名</th>
                  <th style={styles.th}>年级</th>
                  <th style={styles.th}>家长电话</th>
                  <th style={styles.th}>签到状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const sid = s.id || s._id;
                  const currentStatus = attendanceMap[sid] || 'present';
                  return (
                    <tr key={sid}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>{s.name}</td>
                      <td style={styles.td}>{s.grade || '-'}</td>
                      <td style={styles.td}>{s.parentPhone || '-'}</td>
                      <td style={styles.td}>
                        <select
                          style={styles.statusSelect(currentStatus)}
                          value={currentStatus}
                          onChange={(e) => setAttendanceMap({ ...attendanceMap, [sid]: e.target.value })}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>{statusLabels[opt]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && <div style={styles.loading}>⏳ 加载学员中...</div>}
      {!loading && selectedCourse && students.length === 0 && !error && (
        <div style={styles.empty}>该课程暂无学员</div>
      )}
      {!selectedCourse && !loading && (
        <div style={styles.empty}>请先选择课程开始签到</div>
      )}
    </div>
  );
}
