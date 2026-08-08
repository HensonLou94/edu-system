const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, insert } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'edu-system-secret-key-2026';

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'teacher', phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '请填写必要信息' });
    }
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: '邮箱已注册' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await insert(
      'INSERT INTO users (email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, name, role, phone]
    );
    res.json({ message: '注册成功', userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }
    const user = await queryOne('SELECT * FROM users WHERE email = ? AND status = "active"', [email]);
    if (!user) {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '密码错误' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未登录' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await queryOne('SELECT id, email, name, role, phone FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'token无效' });
  }
});

module.exports = router;
