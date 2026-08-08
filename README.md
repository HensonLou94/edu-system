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

- **前端**：React 18 + TailwindCSS + React Router
- **后端**：Node.js + Express + JWT
- **数据库**：SQLite3（可切换 MySQL/PostgreSQL）
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

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/edu-system.git
cd edu-system

# 启动后端
cd backend
npm install
node server.js

# 启动前端（新终端）
cd frontend
npm install
npm start
```

### 默认管理员账号

- 邮箱：admin@edumanager.com
- 密码：admin123

## 📦 部署

### 云服务器部署（CentOS 9）

```bash
# 1. 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 克隆项目
git clone https://github.com/your-username/edu-system.git
cd edu-system

# 4. 安装依赖并构建前端
cd frontend && npm install && npm run build
cd ../backend && npm install

# 5. 启动后端
pm2 start server.js --name edu-api

# 6. 配置 Nginx
sudo vim /etc/nginx/conf.d/edu.conf
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/edu-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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

- 项目主页：https://github.com/your-username/edu-system
- Issues：https://github.com/your-username/edu-system/issues
