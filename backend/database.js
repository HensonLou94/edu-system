const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'edu_system.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// 初始化数据库表
function initDatabase() {
  const db = getDb();

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'teacher' CHECK(role IN ('admin','teacher','finance','frontdesk')),
      phone TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 学员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT DEFAULT 'male' CHECK(gender IN ('male','female')),
      birthday DATE,
      phone TEXT,
      parent_name TEXT,
      parent_phone TEXT NOT NULL,
      address TEXT,
      grade TEXT,
      school TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','graduated')),
      enrollment_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 课程表
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade_level TEXT,
      description TEXT,
      total_hours INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 教师表
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      subjects TEXT,
      specialty TEXT,
      hourly_rate REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 排课表
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
      status TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )
  `);

  // 学员选课表
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrollment_date DATE NOT NULL,
      total_hours INTEGER DEFAULT 0,
      used_hours INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','dropped')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  // 签到考勤表
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      class_date DATE NOT NULL,
      check_in_time DATETIME,
      status TEXT DEFAULT 'absent' CHECK(status IN ('present','absent','late','leave')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(schedule_id, student_id, class_date)
    )
  `);

  // 收费记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      student_id INTEGER NOT NULL,
      course_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','wechat','alipay','bank','other')),
      payment_type TEXT DEFAULT 'tuition' CHECK(payment_type IN ('tuition','deposit','refund','other')),
      payment_date DATE NOT NULL,
      period_start DATE,
      period_end DATE,
      notes TEXT,
      operator_id INTEGER,
      status TEXT DEFAULT 'paid' CHECK(status IN ('paid','refunded','pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 作业表
  db.exec(`
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      due_date DATE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // 插入默认管理员（如果不存在）
  const bcrypt = require('bcryptjs');
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@edumanager.com');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run('admin@edumanager.com', hash, '系统管理员', 'admin', '13800138000');
    console.log('✅ 默认管理员已创建: admin@edumanager.com / admin123');
  }

  console.log('✅ SQLite数据库初始化完成');
}

// 执行查询（返回多行）
function query(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).all(...params);
}

// 执行查询（返回单行）
function queryOne(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).get(...params);
}

// 插入数据
function insert(sql, params = []) {
  const db = getDb();
  const result = db.prepare(sql).run(...params);
  return result.lastInsertRowid;
}

// 更新数据
function update(sql, params = []) {
  const db = getDb();
  const result = db.prepare(sql).run(...params);
  return result.changes;
}

// 删除数据
function remove(sql, params = []) {
  const db = getDb();
  const result = db.prepare(sql).run(...params);
  return result.changes;
}

module.exports = {
  initDatabase,
  query,
  queryOne,
  insert,
  update,
  remove,
  getDb
};
