#!/usr/bin/env python3
"""教培管理系统 API 完整测试"""
import requests
import json
import sys

BASE = "http://localhost:3001"
TOKEN = None
RESULTS = []

def test(name, method, path, data=None, headers=None):
    """执行测试并记录结果"""
    url = BASE + path
    try:
        if method == "GET":
            r = requests.get(url, headers=headers or {})
        elif method == "POST":
            r = requests.post(url, json=data, headers=headers or {})
        elif method == "PUT":
            r = requests.put(url, json=data, headers=headers or {})
        elif method == "DELETE":
            r = requests.delete(url, headers=headers or {})
        else:
            RESULTS.append((name, False, f"Unknown method: {method}"))
            return None
        
        status_ok = 200 <= r.status_code < 300
        try:
            body = r.json()
        except:
            body = r.text
        
        RESULTS.append((name, status_ok, body))
        return body
    except Exception as e:
        RESULTS.append((name, False, str(e)))
        return None

def auth_headers():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

print("=" * 60)
print("  教培管理系统 - 完整 API 测试 (29项)")
print("=" * 60)

# 1. 健康检查
r1 = test("1. 健康检查 - GET /api/health", "GET", "/api/health")

# 2. 登录
r2 = test("2. 登录 - POST /api/auth/login", "POST", "/api/auth/login", 
          data={"email": "admin@edumanager.com", "password": "admin123"})
if r2 and "token" in r2:
    TOKEN = r2["token"]

# 3. 获取用户信息
h = auth_headers()
r3 = test("3. 获取用户信息 - GET /api/auth/me", "GET", "/api/auth/me", headers=h)

# 4. 创建3个学员
r4a = test("4a. 创建学员1(张三)", "POST", "/api/students",
          data={"student_no":"S001","name":"张三","gender":"male","parent_phone":"13900001111","grade":"高一","school":"一中"}, headers=h)
r4b = test("4b. 创建学员2(李四)", "POST", "/api/students",
          data={"student_no":"S002","name":"李四","gender":"female","parent_phone":"13900002222","grade":"高二","school":"二中"}, headers=h)
r4c = test("4c. 创建学员3(王五)", "POST", "/api/students",
          data={"student_no":"S003","name":"王五","gender":"male","parent_phone":"13900003333","grade":"高三","school":"三中"}, headers=h)
RESULTS.pop()  # 合并为一个测试
RESULTS.pop()
RESULTS.pop()
ok4 = all([r4a, r4b, r4c]) and all("studentId" in x for x in [r4a, r4b, r4c])
RESULTS.append(("4. 创建3个学员 - POST /api/students", ok4, f"成功创建3个: {[x.get('studentNo') for x in [r4a, r4b, r4c]]}"))

# 5. 获取学员列表
r5 = test("5. 获取学员列表 - GET /api/students", "GET", "/api/students", headers=h)

# 6. 更新学员
r6 = test("6. 更新学员 - PUT /api/students/1", "PUT", "/api/students/1",
          data={"phone":"13800138888","notes":"已更新信息"}, headers=h)

# 7. 删除学员
r7 = test("7. 删除学员 - DELETE /api/students/3", "DELETE", "/api/students/3", headers=h)

# 8. 创建2门课程
r8a = test("8a. 创建课程1(数学)", "POST", "/api/courses",
          data={"name":"数学提高班","subject":"数学","grade_level":"高一","total_hours":48,"price":3000}, headers=h)
r8b = test("8b. 创建课程2(英语)", "POST", "/api/courses",
          data={"name":"英语基础班","subject":"英语","grade_level":"高二","total_hours":36,"price":2400}, headers=h)
RESULTS.pop()
RESULTS.pop()
ok8 = all([r8a, r8b]) and all("courseId" in x for x in [r8a, r8b])
RESULTS.append(("8. 创建2门课程 - POST /api/courses", ok8, [r8a, r8b]))

# 9. 获取课程列表
r9 = test("9. 获取课程列表 - GET /api/courses", "GET", "/api/courses", headers=h)

# 10. 获取课程下拉
r10 = test("10. 获取课程下拉 - GET /api/courses/all", "GET", "/api/courses/all", headers=h)

# 11. 创建教师
r11 = test("11. 创建教师 - POST /api/teachers", "POST", "/api/teachers",
          data={"name":"刘老师","phone":"13700137000","subjects":"数学","specialty":"高中数学","hourly_rate":200}, headers=h)

# 12. 获取教师列表
r12 = test("12. 获取教师列表 - GET /api/teachers", "GET", "/api/teachers", headers=h)

# 13. 获取教师下拉
r13 = test("13. 获取教师下拉 - GET /api/teachers/all", "GET", "/api/teachers/all", headers=h)

# 14. 排课
r14 = test("14. 排课 - POST /api/schedules", "POST", "/api/schedules",
          data={"course_id":1,"teacher_id":1,"classroom":"A101","day_of_week":1,"start_time":"09:00","end_time":"11:00","start_date":"2026-09-01","end_date":"2026-12-31"}, headers=h)

# 15. 获取排课列表
r15 = test("15. 获取排课列表 - GET /api/schedules", "GET", "/api/schedules", headers=h)

# 16. 学员报名
r16a = test("16a. 学员1报名", "POST", "/api/enrollments",
          data={"student_id":1,"course_id":1,"enrollment_date":"2026-08-09","total_hours":48}, headers=h)
r16b = test("16b. 学员2报名", "POST", "/api/enrollments",
          data={"student_id":2,"course_id":1,"enrollment_date":"2026-08-09","total_hours":48}, headers=h)
RESULTS.pop()
RESULTS.pop()
ok16 = all([r16a, r16b]) and all("enrollmentId" in x for x in [r16a, r16b])
RESULTS.append(("16. 学员报名 - POST /api/enrollments", ok16, [r16a, r16b]))

# 17. 获取报名列表
r17 = test("17. 获取报名列表 - GET /api/enrollments", "GET", "/api/enrollments", headers=h)

# 18. 获取签到学员
r18 = test("18. 获取签到学员 - GET /api/attendance/students/1", "GET", "/api/attendance/students/1", headers=h)

# 19. 提交签到
r19 = test("19. 提交签到 - POST /api/attendance", "POST", "/api/attendance",
          data={"schedule_id":1,"class_date":"2026-08-09","records":[{"student_id":1,"status":"present"},{"student_id":2,"status":"present"}]}, headers=h)

# 20. 收费
r20 = test("20. 收费 - POST /api/payments", "POST", "/api/payments",
          data={"student_id":1,"course_id":1,"amount":3000,"payment_method":"wechat","payment_date":"2026-08-09","notes":"学费"}, headers=h)

# 21. 获取收费列表
r21 = test("21. 获取收费列表 - GET /api/payments", "GET", "/api/payments", headers=h)

# 22. 收费汇总
r22 = test("22. 收费汇总 - GET /api/payments/summary", "GET", "/api/payments/summary", headers=h)

# 23. 布置作业
r23 = test("23. 布置作业 - POST /api/homework", "POST", "/api/homework",
          data={"teacher_id":1,"course_id":1,"title":"第一章习题","content":"完成课本P1-20练习题","due_date":"2026-08-16"}, headers=h)

# 24. 获取作业列表
r24 = test("24. 获取作业列表 - GET /api/homework", "GET", "/api/homework", headers=h)

# 25. 仪表盘报表
r25 = test("25. 仪表盘报表 - GET /api/reports/dashboard", "GET", "/api/reports/dashboard", headers=h)

# 26. 收入报表
r26 = test("26. 收入报表 - GET /api/reports/revenue", "GET", "/api/reports/revenue", headers=h)

# 27. 学员统计
r27 = test("27. 学员统计 - GET /api/reports/students", "GET", "/api/reports/students", headers=h)

# 28. 课程统计
r28 = test("28. 课程统计 - GET /api/reports/courses", "GET", "/api/reports/courses", headers=h)

# 29. 教师统计
r29 = test("29. 教师统计 - GET /api/reports/teachers", "GET", "/api/reports/teachers", headers=h)

# 输出结果
print("\n" + "=" * 60)
print("  测试结果")
print("=" * 60)
pass_count = 0
fail_count = 0
for name, ok, detail in RESULTS:
    if ok:
        print(f"  ✅ {name}")
        pass_count += 1
    else:
        print(f"  ❌ {name}")
        print(f"     详情: {json.dumps(detail, ensure_ascii=False, default=str)[:200]}")
        fail_count += 1

print("\n" + "=" * 60)
print(f"  结果: {pass_count}/{pass_count + fail_count} 通过")
if fail_count > 0:
    print(f"  失败: {fail_count} 项")
print("=" * 60)
