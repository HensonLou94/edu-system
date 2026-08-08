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

const DAYS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 获取排课列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, teacher_id, course_id, day_of_week } = req.query;
    let sql = `SELECT s.*, c.name as course_name, c.subject, t.name as teacher_name 
               FROM schedules s 
               JOIN courses c ON s.course_id = c.id 
               JOIN teachers t ON s.teacher_id = t.id 
               WHERE 1=1`;
    const params = [];
    if (teacher_id) { sql += ' AND s.teacher_id = ?'; params.push(teacher_id); }
    if (course_id) { sql += ' AND s.course_id = ?'; params.push(course_id); }
    if (day_of_week) { sql += ' AND s.day_of_week = ?'; params.push(day_of_week); }
    sql += ' ORDER BY s.day_of_week, s.start_time';
    const totalResult = await queryOne(sql.replace('SELECT s.*', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const schedules = await query(sql, params);
    // 添加中文星期
    schedules.forEach(s => { s.day_name = DAYS[s.day_of_week]; });
    res.json({ schedules, total: totalResult.total });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取教师的课表
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const schedules = await query(
      `SELECT s.*, c.name as course_name, c.subject FROM schedules s 
       JOIN courses c ON s.course_id = c.id 
       WHERE s.teacher_id = ? AND s.status = 'active'
       ORDER BY s.day_of_week, s.start_time`,
      [req.params.teacherId]
    );
    schedules.forEach(s => { s.day_name = DAYS[s.day_of_week]; });
    res.json(schedules);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 创建排课
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'frontdesk'].includes(req.user.role)) return res.status(403).json({ error: '权限不足' });
    const { course_id, teacher_id, classroom, day_of_week, start_time, end_time, start_date, end_date, max_students } = req.body;
    if (!course_id || !teacher_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({ error: '请填写完整排课信息' });
    }
    // 检查时间冲突
    const conflict = await queryOne(
      `SELECT id FROM schedules WHERE teacher_id = ? AND day_of_week = ? AND status = 'active'
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`,
      [teacher_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time]
    );
    if (conflict) return res.status(400).json({ error: '该教师在此时间段已有课程' });
    const scheduleId = await insert(
      `INSERT INTO schedules (course_id, teacher_id, classroom, day_of_week, start_time, end_time, start_date, end_date, max_students) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, teacher_id, classroom, day_of_week, start_time, end_time, start_date, end_date, max_students || 30]
    );
    res.json({ message: '排课成功', scheduleId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新排课
router.put('/:id', auth, async (req, res) => {
  try {
    const { course_id, teacher_id, classroom, day_of_week, start_time, end_time, start_date, end_date, max_students, status } = req.body;
    await update(
      `UPDATE schedules SET course_id=?, teacher_id=?, classroom=?, day_of_week=?, start_time=?, end_time=?, start_date=?, end_date=?, max_students=?, status=? WHERE id=?`,
      [course_id, teacher_id, classroom, day_of_week, start_time, end_time, start_date, end_date, max_students, status, req.params.id]
    );
    res.json({ message: '更新成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除排课
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除' });
    await remove('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
