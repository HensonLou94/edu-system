const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'edu-system-secret-key-2026';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登录' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'token无效' }); }
}

// 仪表盘概览数据
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalStudents = await queryOne('SELECT COUNT(*) as count FROM students WHERE status = "active"');
    const totalTeachers = await queryOne('SELECT COUNT(*) as count FROM teachers WHERE status = "active"');
    const totalCourses = await queryOne('SELECT COUNT(*) as count FROM courses WHERE status = "active"');
    const todayAttendance = await queryOne(
      `SELECT COUNT(*) as count FROM attendance WHERE class_date = CURDATE() AND status IN ('present', 'late')`
    );
    const totalRevenue = await queryOne(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "paid" AND YEAR(payment_date) = YEAR(CURDATE())'
    );
    const monthRevenue = await queryOne(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "paid" AND MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())'
    );
    const pendingPayments = await queryOne(
      `SELECT COUNT(DISTINCT student_id) as count FROM enrollments e 
       LEFT JOIN payments p ON e.student_id = p.student_id AND p.status = 'paid'
       WHERE e.status = 'active' AND p.id IS NULL`
    );
    res.json({
      totalStudents: totalStudents.count,
      totalTeachers: totalTeachers.count,
      totalCourses: totalCourses.count,
      todayAttendance: todayAttendance.count,
      totalRevenue: totalRevenue.total,
      monthRevenue: monthRevenue.total,
      pendingPayments: pendingPayments.count
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 月度收入报表
router.get('/revenue', auth, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthlyRevenue = await query(
      `SELECT MONTH(payment_date) as month, SUM(amount) as amount, COUNT(*) as count
       FROM payments WHERE status = 'paid' AND YEAR(payment_date) = ?
       GROUP BY MONTH(payment_date) ORDER BY month`,
      [year]
    );
    res.json(monthlyRevenue);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 学员统计
router.get('/students', auth, async (req, res) => {
  try {
    const byGrade = await query(
      'SELECT grade, COUNT(*) as count FROM students WHERE status = "active" GROUP BY grade ORDER BY count DESC'
    );
    const byGender = await query(
      'SELECT gender, COUNT(*) as count FROM students WHERE status = "active" GROUP BY gender'
    );
    const monthlyEnrollment = await query(
      `SELECT MONTH(enrollment_date) as month, COUNT(*) as count 
       FROM students WHERE YEAR(enrollment_date) = YEAR(CURDATE()) 
       GROUP BY MONTH(enrollment_date) ORDER BY month`
    );
    res.json({ byGrade, byGender, monthlyEnrollment });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 课程统计
router.get('/courses', auth, async (req, res) => {
  try {
    const bySubject = await query(
      `SELECT c.subject, COUNT(DISTINCT c.id) as course_count, COUNT(DISTINCT e.student_id) as student_count
       FROM courses c LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
       WHERE c.status = 'active' GROUP BY c.subject ORDER BY student_count DESC`
    );
    const courseRevenue = await query(
      `SELECT c.name, c.subject, COALESCE(SUM(p.amount), 0) as revenue
       FROM courses c LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'paid'
       WHERE c.status = 'active' GROUP BY c.id ORDER BY revenue DESC LIMIT 10`
    );
    res.json({ bySubject, courseRevenue });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 教师课时统计
router.get('/teachers', auth, async (req, res) => {
  try {
    const teacherHours = await query(
      `SELECT t.name, t.subjects, 
        (SELECT COUNT(*) FROM attendance a JOIN schedules s ON a.schedule_id = s.id WHERE s.teacher_id = t.id AND a.status IN ('present', 'late')) as total_hours,
        (SELECT COALESCE(SUM(amount), 0) FROM payments p JOIN courses c ON p.course_id = c.id JOIN schedules s ON s.course_id = c.id WHERE s.teacher_id = t.id AND p.status = 'paid') as total_payment
       FROM teachers t WHERE t.status = 'active' ORDER BY total_hours DESC`
    );
    res.json(teacherHours);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
