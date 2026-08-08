const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, queryOne, insert, update, remove } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'edu-system-secret-key-2026';

// 认证中间件
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'token无效' }); }
}

// 生成学员编号
async function generateStudentNo() {
  const last = await queryOne('SELECT student_no FROM students ORDER BY id DESC LIMIT 1');
  if (!last) return 'STU20260001';
  const num = parseInt(last.student_no.replace('STU', '')) + 1;
  return 'STU' + String(num).padStart(6, '0');
}

// 获取学员列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, grade, keyword } = req.query;
    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (grade) { sql += ' AND grade = ?'; params.push(grade); }
    if (keyword) { sql += ' AND (name LIKE ? OR parent_name LIKE ? OR parent_phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    sql += ' ORDER BY created_at DESC';
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await queryOne(countSql, params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const students = await query(sql, params);
    res.json({ students, total: totalResult.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取单个学员
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await queryOne('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: '学员不存在' });
    // 获取学员选课信息
    const enrollments = await query(
      `SELECT e.*, c.name as course_name, c.subject FROM enrollments e 
       JOIN courses c ON e.course_id = c.id WHERE e.student_id = ?`,
      [req.params.id]
    );
    res.json({ ...student, enrollments });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 创建学员
router.post('/', auth, async (req, res) => {
  try {
    const { name, gender, birthday, phone, parent_name, parent_phone, address, grade, school, notes } = req.body;
    if (!name || !parent_phone) return res.status(400).json({ error: '请填写学员姓名和家长电话' });
    const studentNo = await generateStudentNo();
    const studentId = await insert(
      `INSERT INTO students (student_no, name, gender, birthday, phone, parent_name, parent_phone, address, grade, school, enrollment_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [studentNo, name, gender || 'male', birthday, phone, parent_name, parent_phone, address, grade, school, notes]
    );
    res.json({ message: '学员创建成功', studentId, studentNo });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 更新学员（部分更新）
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['name', 'gender', 'birthday', 'phone', 'parent_name', 'parent_phone', 'address', 'grade', 'school', 'status', 'notes'];
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
    await update(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '更新成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除学员
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除' });
    await remove('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
