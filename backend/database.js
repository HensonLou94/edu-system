const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' for local, 'mariadb' for production

let db;

// SQLite模式（本地测试）
if (DB_TYPE === 'sqlite') {
  const Database = require('better-sqlite3');
  const path = require('path');
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'edu_system.db');
  
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // 初始化表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      phone TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT DEFAULT 'male',
      birthday DATE,
      phone TEXT,
      parent_name TEXT,
      parent_phone TEXT NOT NULL,
      address TEXT,
      grade TEXT,
      school TEXT,
      status TEXT DEFAULT 'active',
      enrollment_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade_level TEXT,
      description TEXT,
      total_hours INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      subjects TEXT,
      specialty TEXT,
      hourly_rate REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      classroom TEXT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      max_students INTEGER DEFAULT 30,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrollment_date DATE NOT NULL,
      total_hours INTEGER DEFAULT 0,
      used_hours INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      class_date DATE NOT NULL,
      check_in_time DATETIME,
      status TEXT DEFAULT 'absent',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(schedule_id, student_id, class_date)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      course_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      payment_type TEXT DEFAULT 'tuition',
      payment_date DATE NOT NULL,
      period_start DATE,
      period_end DATE,
      notes TEXT,
      operator_id INTEGER,
      status TEXT DEFAULT 'paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      due_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);
  
  // 插入默认管理员
  const bcrypt = require('bcryptjs');
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@edumanager.com');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run('admin@edumanager.com', hash, '系统管理员', 'admin', '13800138000');
  }
  
  console.log('✅ SQLite数据库初始化完成（本地测试模式）');
}

// MariaDB模式（生产环境）
async function initMariaDB() {
  const mariadb = require('mariadb');
  
  const conn = await mariadb.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4'
  });
  
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'edu_system'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ${process.env.DB_NAME || 'edu_system'}`);
  
  // 用户表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role ENUM('admin', 'teacher', 'finance', 'frontdesk') DEFAULT 'teacher',
      phone VARCHAR(20),
      avatar VARCHAR(500),
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 学员表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_no VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      gender ENUM('male', 'female') DEFAULT 'male',
      birthday DATE,
      phone VARCHAR(20),
      parent_name VARCHAR(100),
      parent_phone VARCHAR(20) NOT NULL,
      address TEXT,
      grade VARCHAR(50),
      school VARCHAR(200),
      status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
      enrollment_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_grade (grade),
      INDEX idx_parent_phone (parent_phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 课程表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      grade_level VARCHAR(50),
      description TEXT,
      total_hours INT DEFAULT 0,
      price DECIMAL(10, 2) DEFAULT 0.00,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_subject (subject),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 教师表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      subjects VARCHAR(500),
      specialty VARCHAR(200),
      hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 排课表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      teacher_id INT NOT NULL,
      classroom VARCHAR(100),
      day_of_week TINYINT NOT NULL COMMENT '1-7 周一到周日',
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      start_date DATE,
      end_date DATE,
      max_students INT DEFAULT 30,
      status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      INDEX idx_teacher (teacher_id),
      INDEX idx_course (course_id),
      INDEX idx_day (day_of_week),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 学员选课表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      enrollment_date DATE NOT NULL,
      total_hours INT DEFAULT 0,
      used_hours INT DEFAULT 0,
      status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE KEY uk_student_course (student_id, course_id),
      INDEX idx_student (student_id),
      INDEX idx_course (course_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 签到考勤表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      schedule_id INT NOT NULL,
      student_id INT NOT NULL,
      class_date DATE NOT NULL,
      check_in_time TIMESTAMP NULL,
      status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'absent',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE KEY uk_schedule_student_date (schedule_id, student_id, class_date),
      INDEX idx_student (student_id),
      INDEX idx_class_date (class_date),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 收费记录表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      receipt_no VARCHAR(50) UNIQUE NOT NULL,
      student_id INT NOT NULL,
      course_id INT,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method ENUM('cash', 'wechat', 'alipay', 'bank', 'other') DEFAULT 'cash',
      payment_type ENUM('tuition', 'deposit', 'refund', 'other') DEFAULT 'tuition',
      payment_date DATE NOT NULL,
      period_start DATE,
      period_end DATE,
      notes TEXT,
      operator_id INT,
      status ENUM('paid', 'refunded', 'pending') DEFAULT 'paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_student (student_id),
      INDEX idx_payment_date (payment_date),
      INDEX idx_status (status),
      INDEX idx_receipt_no (receipt_no)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 作业表
  await conn.query(`
    CREATE TABLE IF NOT EXISTS homework (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      course_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      due_date DATE,
      status ENUM('active', 'closed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      INDEX idx_teacher (teacher_id),
      INDEX idx_course (course_id),
      INDEX idx_due_date (due_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // 插入默认管理员
  const bcrypt = require('bcryptjs');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await conn.query(`
    INSERT IGNORE INTO users (email, password_hash, name, role, phone) 
    VALUES (?, ?, ?, ?, ?)
  `, ['admin@edumanager.com', adminPassword, '系统管理员', 'admin', '13800138000']);
  
  console.log('✅ MariaDB数据库初始化完成（生产环境模式）');
  await conn.end();
}

// 初始化函数
async function initDatabase() {
  if (DB_TYPE === 'sqlite') {
    // SQLite已在上面初始化
    return;
  }
  await initMariaDB();
}

// 执行查询
async function query(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    return db.prepare(sql).all(...params);
  }
  const mariadb = require('mariadb');
  const pool = await mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edu_system',
    charset: 'utf8mb4',
    connectionLimit: 10
  });
  const rows = await pool.query(sql, params);
  await pool.end();
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function insert(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    const result = db.prepare(sql).run(...params);
    return result.lastInsertRowid;
  }
  const mariadb = require('mariadb');
  const pool = await mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edu_system',
    charset: 'utf8mb4',
    connectionLimit: 10
  });
  const result = await pool.query(sql, params);
  await pool.end();
  return Number(result.insertId);
}

async function update(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    const result = db.prepare(sql).run(...params);
    return result.changes;
  }
  const mariadb = require('mariadb');
  const pool = await mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edu_system',
    charset: 'utf8mb4',
    connectionLimit: 10
  });
  const result = await pool.query(sql, params);
  await pool.end();
  return Number(result.affectedRows);
}

async function remove(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    const result = db.prepare(sql).run(...params);
    return result.changes;
  }
  const mariadb = require('mariadb');
  const pool = await mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edu_system',
    charset: 'utf8mb4',
    connectionLimit: 10
  });
  const result = await pool.query(sql, params);
  await pool.end();
  return Number(result.affectedRows);
}

module.exports = {
  initDatabase,
  query,
  queryOne,
  insert,
  update,
  remove
};
