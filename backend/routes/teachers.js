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

// 获取教师列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    let sql = 'SELECT t.*, u.email, u.role as user_role FROM teachers t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    sql += ' ORDER BY t.created_at DESC';
    const totalResult = await queryOne(sql.replace('SELECT t.*', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const teachers = await query(sql, params);
    res.json({ teachers, total: totalResult.total });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取所有教师（下拉选择用）
router.get('/all', auth, async (req, res) => {
  try {
    const teachers = await query("SELECT id, name, subjects, specialty FROM teachers WHERE status = 'active' ORDER BY name");
    res.json(teachers);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 添加教师
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'frontdesk'].includes(req.user.role)) return res.status(403).json({ error: '权限不足' });
    const { name, phone, subject, subjects, specialty, hourly_rate, user_id } = req.body;
    if (!name) return res.status(400).json({ error: '请填写教师姓名' });
    const teacherId = await insert(
      'INSERT INTO teachers (user_id, name, phone, subjects, specialty, hourly_rate) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id || null, name, phone, subjects || subject, specialty, hourly_rate || 0]
    );
    res.json({ message: '教师添加成功', teacherId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新教师（部分更新）
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['name', 'phone', 'subjects', 'specialty', 'hourly_rate', 'status'];
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
    await update(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '更新成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除教师
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除' });
    await remove('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
