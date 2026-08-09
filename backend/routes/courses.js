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

// 获取课程列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, status } = req.query;
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    if (subject) { sql += ' AND subject = ?'; params.push(subject); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const totalResult = await queryOne(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const courses = await query(sql, params);
    res.json({ courses, total: totalResult.total });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取所有课程（下拉选择用）
router.get('/all', auth, async (req, res) => {
  try {
    const courses = await query("SELECT id, name, subject, grade_level, price FROM courses WHERE status = 'active' ORDER BY name");
    res.json(courses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 创建课程
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'frontdesk'].includes(req.user.role)) return res.status(403).json({ error: '权限不足' });
    const { name, subject, grade_level, description, total_hours, price } = req.body;
    if (!name || !subject) return res.status(400).json({ error: '请填写课程名称和科目' });
    const courseId = await insert(
      'INSERT INTO courses (name, subject, grade_level, description, total_hours, price) VALUES (?, ?, ?, ?, ?, ?)',
      [name, subject, grade_level, description, total_hours || 0, price || 0]
    );
    res.json({ message: '课程创建成功', courseId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新课程（部分更新）
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['name', 'subject', 'grade_level', 'description', 'total_hours', 'price', 'status'];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: '没有需要更新的字段' });
    params.push(req.params.id);
    await update(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '更新成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除课程
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除' });
    await remove('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
