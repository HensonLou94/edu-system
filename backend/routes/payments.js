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

// 生成收据编号
async function generateReceiptNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const last = await queryOne('SELECT receipt_no FROM payments WHERE receipt_no LIKE ? ORDER BY id DESC LIMIT 1', [`RCV${date}%`]);
  if (!last) return `RCV${date}001`;
  const num = parseInt(last.receipt_no.slice(-3)) + 1;
  return `RCV${date}${String(num).padStart(3, '0')}`;
}

// 获取收费记录列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, student_id, payment_type, start_date, end_date } = req.query;
    let sql = `SELECT p.*, s.name as student_name, s.student_no, c.name as course_name, u.name as operator_name
               FROM payments p 
               LEFT JOIN students s ON p.student_id = s.id 
               LEFT JOIN courses c ON p.course_id = c.id
               LEFT JOIN users u ON p.operator_id = u.id
               WHERE 1=1`;
    const params = [];
    if (student_id) { sql += ' AND p.student_id = ?'; params.push(student_id); }
    if (payment_type) { sql += ' AND p.payment_type = ?'; params.push(payment_type); }
    if (start_date) { sql += ' AND p.payment_date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND p.payment_date <= ?'; params.push(end_date); }
    sql += ' ORDER BY p.created_at DESC';
    const totalResult = await queryOne(sql.replace('SELECT p.*', 'SELECT COUNT(*) as total'), params);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const payments = await query(sql, params);
    res.json({ payments, total: totalResult.total });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 获取收费汇总
router.get('/summary', auth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let where = "WHERE status = 'paid'";
    const params = [];
    if (start_date) { where += ' AND payment_date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND payment_date <= ?'; params.push(end_date); }
    const summary = await queryOne(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'wechat' THEN amount ELSE 0 END), 0) as wechat_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'alipay' THEN amount ELSE 0 END), 0) as alipay_amount
       FROM payments ${where}`,
      params
    );
    res.json(summary);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 创建收费记录
router.post('/', auth, async (req, res) => {
  try {
    const { student_id, course_id, amount, payment_method, payment_type, payment_date, period_start, period_end, notes } = req.body;
    if (!student_id || !amount || !payment_date) {
      return res.status(400).json({ error: '请填写必要信息' });
    }
    const receiptNo = await generateReceiptNo();
    const paymentId = await insert(
      `INSERT INTO payments (receipt_no, student_id, course_id, amount, payment_method, payment_type, payment_date, period_start, period_end, notes, operator_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNo, student_id, course_id || null, amount, payment_method || 'cash', payment_type || 'tuition', payment_date, period_start, period_end, notes, req.user.id]
    );
    res.json({ message: '收费成功', paymentId, receiptNo });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 退款
router.put('/:id/refund', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可退款' });
    const payment = await queryOne('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payment) return res.status(404).json({ error: '记录不存在' });
    if (payment.status === 'refunded') return res.status(400).json({ error: '已退款' });
    await update('UPDATE payments SET status = ? WHERE id = ?', ['refunded', req.params.id]);
    // 创建退款记录
    const refundNo = await generateReceiptNo();
    await insert(
      `INSERT INTO payments (receipt_no, student_id, course_id, amount, payment_method, payment_type, payment_date, notes, operator_id, status) 
       VALUES (?, ?, ?, ?, ?, 'refund', date('now'), ?, ?, 'paid')`,
      [refundNo, payment.student_id, payment.course_id, -payment.amount, payment.payment_method, `退款原收据:${payment.receipt_no}`, req.user.id]
    );
    res.json({ message: '退款成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 删除收费记录
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '仅管理员可删除' });
    await remove('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
