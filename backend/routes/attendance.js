const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, queryOne, insert, update } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'edu-system-secret-key-2026';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'token无效' }); }
}

// 获取某节课的签到列表
router.get('/', auth, async (req, res) => {
  try {
    const { schedule_id, class_date } = req.query;
    if (!schedule_id) return res.status(400).json({ error: '请指定课程' });
    let sql = `SELECT a.*, s.name as student_name, s.student_no, s.parent_phone
               FROM attendance a 
               JOIN students s ON a.student_id = s.id 
               WHERE a.schedule_id = ?`;
    const params = [schedule_id];
    if (class_date) { sql += ' AND a.class_date = ?'; params.push(class_date); }
    sql += ' ORDER BY s.student_no';
    const attendance = await query(sql, params);
    res.json(attendance);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取某节课应到学员列表（从未签到的学员中选）
router.get('/students/:scheduleId', auth, async (req, res) => {
  try {
    const schedule = await queryOne('SELECT * FROM schedules WHERE id = ?', [req.params.scheduleId]);
    if (!schedule) return res.status(404).json({ error: '课程不存在' });
    // 获取已报名该课程的学员
    const students = await query(
      `SELECT s.id, s.student_no, s.name, s.parent_phone 
       FROM students s 
       JOIN enrollments e ON s.id = e.student_id 
       WHERE e.course_id = ? AND e.status = 'active' AND s.status = 'active'`,
      [schedule.course_id]
    );
    res.json(students);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 提交签到（批量）
router.post('/', auth, async (req, res) => {
  try {
    const { schedule_id, class_date, records } = req.body;
    // records: [{ student_id, status, notes }]
    if (!schedule_id || !class_date || !records) {
      return res.status(400).json({ error: '请填写完整签到信息' });
    }
    for (const record of records) {
      await insert(
        `INSERT INTO attendance (schedule_id, student_id, class_date, check_in_time, status, notes) 
         VALUES (?, ?, ?, NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), check_in_time = NOW(), notes = VALUES(notes)`,
        [schedule_id, record.student_id, class_date, record.status || 'present', record.notes || null]
      );
    }
    // 更新课消
    if (records.some(r => r.status === 'present' || r.status === 'late')) {
      const schedule = await queryOne('SELECT course_id FROM schedules WHERE id = ?', [schedule_id]);
      if (schedule) {
        for (const record of records) {
          if (record.status === 'present' || record.status === 'late') {
            await update(
              'UPDATE enrollments SET used_hours = used_hours + 1 WHERE student_id = ? AND course_id = ? AND status = "active"',
              [record.student_id, schedule.course_id]
            );
          }
        }
      }
    }
    res.json({ message: '签到成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取学生考勤统计
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const stats = await queryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_count
       FROM attendance WHERE student_id = ?`,
      [req.params.studentId]
    );
    res.json(stats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
