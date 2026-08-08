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

// 获取作业列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, course_id, teacher_id } = req.query;
    let sql = `SELECT h.*, t.name as teacher_name, c.name as course_name, c.subject
               FROM homework h 
               JOIN teachers t ON h.teacher_id = t.id 
               JOIN courses c ON h.course_id = c.id WHERE 1=1`;
    const params = [];
    if (course_id) { sql += ' AND h.course_id = ?'; params.push(course_id); }
    if (teacher_id) { sql += ' AND h.teacher_id = ?'; params.push(teacher_id); }
    sql += ' ORDER BY h.created_at DESC';
    const totalResult = await queryOne(sql.replace('SELECT h.*', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const homework = await query(sql, params);
    res.json({ homework, total: totalResult.total });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取教师的作业列表（教师端用）
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const homework = await query(
      `SELECT h.*, c.name as course_name, c.subject FROM homework h 
       JOIN courses c ON h.course_id = c.id 
       WHERE h.teacher_id = ? ORDER BY h.created_at DESC`,
      [req.params.teacherId]
    );
    res.json(homework);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 创建作业
router.post('/', auth, async (req, res) => {
  try {
    const { teacher_id, course_id, title, content, due_date } = req.body;
    if (!teacher_id || !course_id || !title) {
      return res.status(400).json({ error: '请填写必要信息' });
    }
    const homeworkId = await insert(
      'INSERT INTO homework (teacher_id, course_id, title, content, due_date) VALUES (?, ?, ?, ?, ?)',
      [teacher_id, course_id, title, content, due_date]
    );
    res.json({ message: '作业发布成功', homeworkId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新作业
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, due_date, status } = req.body;
    await update('UPDATE homework SET title=?, content=?, due_date=?, status=? WHERE id=?',
      [title, content, due_date, status, req.params.id]);
    res.json({ message: '更新成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除作业
router.delete('/:id', auth, async (req, res) => {
  try {
    await remove('DELETE FROM homework WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
