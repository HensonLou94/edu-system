const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, queryOne, insert, update, remove } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'edu-system-secret-key-2026';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'token无效' }); }
}

// 获取学员的选课列表
router.get('/', auth, async (req, res) => {
  try {
    const { student_id, course_id } = req.query;
    let sql = `SELECT e.*, s.name as student_name, s.student_no, c.name as course_name, c.subject 
               FROM enrollments e 
               JOIN students s ON e.student_id = s.id 
               JOIN courses c ON e.course_id = c.id WHERE 1=1`;
    const params = [];
    if (student_id) { sql += ' AND e.student_id = ?'; params.push(student_id); }
    if (course_id) { sql += ' AND e.course_id = ?'; params.push(course_id); }
    sql += ' ORDER BY e.created_at DESC';
    const enrollments = await query(sql, params);
    res.json(enrollments);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 学员报名课程
router.post('/', auth, async (req, res) => {
  try {
    const { student_id, course_id, total_hours } = req.body;
    if (!student_id || !course_id) return res.status(400).json({ error: '请选择学员和课程' });
    // 检查是否已报名
    const existing = await queryOne("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active'", [student_id, course_id]);
    if (existing) return res.status(400).json({ error: '该学员已报名此课程' });
    const enrollmentId = await insert(
      "INSERT INTO enrollments (student_id, course_id, enrollment_date, total_hours) VALUES (?, ?, date('now'), ?)",
      [student_id, course_id, total_hours || 0]
    );
    res.json({ message: '报名成功', enrollmentId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新课消
router.put('/:id/consume', auth, async (req, res) => {
  try {
    const { hours } = req.body;
    await update('UPDATE enrollments SET used_hours = used_hours + ? WHERE id = ?', [hours || 1, req.params.id]);
    res.json({ message: '课消成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 退课
router.put('/:id/drop', auth, async (req, res) => {
  try {
    await update('UPDATE enrollments SET status = "dropped" WHERE id = ?', [req.params.id]);
    res.json({ message: '退课成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
