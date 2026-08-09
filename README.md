# EduManager - 教培行业管理系统

一个为教育培训机构量身打造的综合管理系统，涵盖学员管理、课程排班、教师管理、收费管理等核心功能。

## ✨ 功能特性

- 🎓 学员管理（报名、分班、学员档案）
- 📅 课程排班（排课、调课、课表查看）
- 👨‍🏫 教师管理（教师档案、课时统计、薪资计算）
- 💰 收费管理（学费收缴、退费、账单生成）
- 📊 数据报表（学员统计、财务报表、课时报表）
- 🔔 消息通知（上课提醒、家长通知）

## 🛠️ 技术栈

- **前端**：React 18 + Axios + React Router
- **后端**：Node.js + Express + JWT + MariaDB
- **数据库**：MariaDB 10.5+
- **部署**：Nginx + PM2

## 📁 项目结构

```
edu-system/
├── frontend/          # 前端 React 应用
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── context/       # 状态管理
│   │   ├── utils/         # 工具函数
│   │   └── App.js         # 路由配置
│   ├── public/
│   └── package.json
├── backend/           # 后端 Express 应用
│   ├── routes/        # API 路由
│   ├── database.js    # 数据库初始化
│   ├── server.js      # 入口文件
│   └── package.json
├── docs/              # 项目文档
├── LICENSE
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- MariaDB >= 10.5

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/HensonLou94/edu-system.git
cd edu-system

# 2. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，填写数据库连接信息

# 3. 启动后端
npm install
node server.js

# 4. 启动前端（新终端）
cd ../frontend
npm install
npm start
```

### 默认管理员账号

- 邮箱：admin@edumanager.com
- 密码：admin123

## 📦 部署

### 云服务器部署（Debian 12）

```bash
# 1. 更新系统并安装 Node.js
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 2. 安装 MariaDB
apt install -y mariadb-server
systemctl start mariadb
systemctl enable mariadb

# 3. 安全配置 MariaDB
mysql_secure_installation
# 按提示设置root密码

# 4. 配置数据库
mysql -u root -p
CREATE DATABASE edu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edu_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON edu_system.* TO 'edu_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 5. 安装 Git、Nginx、PM2
apt install -y git nginx
systemctl start nginx
systemctl enable nginx
npm install -g pm2

# 6. 克隆项目
cd /opt
git clone https://github.com/HensonLou94/edu-system.git
cd edu-system

# 7. 配置环境变量
cd backend
cp .env.example .env
vim .env
# 设置 DB_TYPE=mariadb
# 设置 DB_HOST=localhost
# 设置 DB_USER=edu_user
# 设置 DB_PASSWORD=your_password
# 设置 DB_NAME=edu_system

# 8. 安装依赖并启动
npm install
pm2 start server.js --name edu-api
pm2 save
pm2 startup

# 9. 构建前端
cd ../frontend
npm install && npm run build

# 10. 配置 Nginx
vim /etc/nginx/sites-available/edu
ln -s /etc/nginx/sites-available/edu /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 11. 开放防火墙
apt install -y ufw
ufw allow 22
ufw allow 'Nginx Full'
ufw enable
```

### Nginx 配置示例（/etc/nginx/sites-available/edu）

```nginx
server {
    listen 80;
    server_name _;

    location / {
        root /opt/edu-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📝 API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/students | 获取学员列表 |
| POST | /api/students | 创建学员 |
| GET | /api/courses | 获取课程列表 |
| POST | /api/courses | 创建课程 |
| GET | /api/schedules | 获取排课表 |
| POST | /api/schedules | 创建排课 |
| GET | /api/teachers | 获取教师列表 |
| POST | /api/teachers | 添加教师 |
| GET | /api/finance/summary | 财务汇总 |

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 项目主页：https://github.com/HensonLou94/edu-system
- Issues：https://github.com/HensonLou94/edu-system/issues
