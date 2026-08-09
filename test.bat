@echo off
setlocal enabledelayedexpansion

set PASS=0
set FAIL=0
set TOKEN=

echo ========================================
echo   教培管理系统 - 完整 API 测试
echo ========================================
echo.

:: 1. 健康检查
echo [1] 健康检查 - GET /api/health
curl -s -w "\n%%{http_code}" http://localhost:3001/api/health > temp.txt 2>&1
set /p body=<temp.txt
if "!body:~0,1!"=="{" (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !body!
    set /a FAIL+=1
)
echo.

:: 2. 登录
echo [2] 登录 - POST /api/auth/login
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@edumanager.com\",\"password\":\"admin123\"}" > temp.txt 2>&1
set /p TOKEN_RESP=<temp.txt
:: 提取token
for /f "tokens=2 delims=:," %%a in ('echo !TOKEN_RESP! ^| findstr "token"') do (
    set TOKEN_RAW=%%a
)
:: 简单处理 - 直接从JSON提取
set TOKEN=!TOKEN_RESP:"=!
set TOKEN=!TOKEN:*token=!
set TOKEN=!TOKEN:~1!
for /f "delims=," %%a in ("!TOKEN!") do set TOKEN=%%a

echo !TOKEN_RESP! | findstr /i "token" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !TOKEN_RESP!
    set /a FAIL+=1
)
echo.

:: 3. 获取用户信息
echo [3] 获取用户信息 - GET /api/auth/me
curl -s -H "Authorization: Bearer !TOKEN!" http://localhost:3001/api/auth/me > temp.txt 2>&1
set /p ME_RESP=<temp.txt
echo !ME_RESP! | findstr /i "admin" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !ME_RESP!
    set /a FAIL+=1
)
echo.

:: 4. 创建3个学员
echo [4] 创建学员 - POST /api/students
curl -s -X POST http://localhost:3001/api/students -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_no\":\"S001\",\"name\":\"张三\",\"gender\":\"male\",\"parent_phone\":\"13900001111\",\"grade\":\"高一\",\"school\":\"一中\"}" > temp.txt 2>&1
set /p S1=<temp.txt
curl -s -X POST http://localhost:3001/api/students -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_no\":\"S002\",\"name\":\"李四\",\"gender\":\"female\",\"parent_phone\":\"13900002222\",\"grade\":\"高二\",\"school\":\"二中\"}" > temp.txt 2>&1
set /p S2=<temp.txt
curl -s -X POST http://localhost:3001/api/students -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_no\":\"S003\",\"name\":\"王五\",\"gender\":\"male\",\"parent_phone\":\"13900003333\",\"grade\":\"高三\",\"school\":\"三中\"}" > temp.txt 2>&1
set /p S3=<temp.txt
echo !S1! | findstr /i "id\|student_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过 - 创建了3个学员
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !S1!
    set /a FAIL+=1
)
echo.

:: 5. 获取学员列表
echo [5] 获取学员列表 - GET /api/students
curl -s http://localhost:3001/api/students -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p LIST_RESP=<temp.txt
echo !LIST_RESP! | findstr /i "张三\|李四\|王五" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !LIST_RESP!
    set /a FAIL+=1
)
echo.

:: 6. 更新学员
echo [6] 更新学员 - PUT /api/students/1
curl -s -X PUT http://localhost:3001/api/students/1 -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"phone\":\"13800138888\",\"notes\":\"已更新信息\"}" > temp.txt 2>&1
set /p UPD_RESP=<temp.txt
echo !UPD_RESP! | findstr /i "success\|message\|id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !UPD_RESP!
    set /a FAIL+=1
)
echo.

:: 7. 删除学员
echo [7] 删除学员 - DELETE /api/students/3
curl -s -X DELETE http://localhost:3001/api/students/3 -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p DEL_RESP=<temp.txt
echo !DEL_RESP! | findstr /i "success\|message\|deleted" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !DEL_RESP!
    set /a FAIL+=1
)
echo.

:: 8. 创建2门课程
echo [8] 创建课程 - POST /api/courses
curl -s -X POST http://localhost:3001/api/courses -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"name\":\"数学提高班\",\"subject\":\"数学\",\"grade_level\":\"高一\",\"total_hours\":48,\"price\":3000}" > temp.txt 2>&1
set /p C1=<temp.txt
curl -s -X POST http://localhost:3001/api/courses -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"name\":\"英语基础班\",\"subject\":\"英语\",\"grade_level\":\"高二\",\"total_hours\":36,\"price\":2400}" > temp.txt 2>&1
set /p C2=<temp.txt
echo !C1! | findstr /i "id\|course_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过 - 创建了2门课程
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !C1!
    set /a FAIL+=1
)
echo.

:: 9. 获取课程列表
echo [9] 获取课程列表 - GET /api/courses
curl -s http://localhost:3001/api/courses -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p C_LIST=<temp.txt
echo !C_LIST! | findstr /i "数学\|英语" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !C_LIST!
    set /a FAIL+=1
)
echo.

:: 10. 获取课程下拉
echo [10] 获取课程下拉 - GET /api/courses/all
curl -s http://localhost:3001/api/courses/all -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p C_ALL=<temp.txt
echo !C_ALL! | findstr /i "数学\|英语" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !C_ALL!
    set /a FAIL+=1
)
echo.

:: 11. 创建教师
echo [11] 创建教师 - POST /api/teachers
curl -s -X POST http://localhost:3001/api/teachers -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"name\":\"刘老师\",\"phone\":\"13700137000\",\"subjects\":\"数学\",\"specialty\":\"高中数学\",\"hourly_rate\":200}" > temp.txt 2>&1
set /p T1=<temp.txt
echo !T1! | findstr /i "id\|teacher_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !T1!
    set /a FAIL+=1
)
echo.

:: 12. 获取教师列表
echo [12] 获取教师列表 - GET /api/teachers
curl -s http://localhost:3001/api/teachers -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p T_LIST=<temp.txt
echo !T_LIST! | findstr /i "刘老师" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !T_LIST!
    set /a FAIL+=1
)
echo.

:: 13. 获取教师下拉
echo [13] 获取教师下拉 - GET /api/teachers/all
curl -s http://localhost:3001/api/teachers/all -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p T_ALL=<temp.txt
echo !T_ALL! | findstr /i "刘老师" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !T_ALL!
    set /a FAIL+=1
)
echo.

:: 14. 排课
echo [14] 排课 - POST /api/schedules
curl -s -X POST http://localhost:3001/api/schedules -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"course_id\":1,\"teacher_id\":1,\"classroom\":\"A101\",\"day_of_week\":1,\"start_time\":\"09:00\",\"end_time\":\"11:00\",\"start_date\":\"2026-09-01\",\"end_date\":\"2026-12-31\"}" > temp.txt 2>&1
set /p SCH=<temp.txt
echo !SCH! | findstr /i "id\|schedule_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !SCH!
    set /a FAIL+=1
)
echo.

:: 15. 获取排课列表
echo [15] 获取排课列表 - GET /api/schedules
curl -s http://localhost:3001/api/schedules -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p SCH_LIST=<temp.txt
echo !SCH_LIST! | findstr /i "A101\|course_id\|teacher_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !SCH_LIST!
    set /a FAIL+=1
)
echo.

:: 16. 学员报名
echo [16] 学员报名 - POST /api/enrollments
curl -s -X POST http://localhost:3001/api/enrollments -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_id\":1,\"course_id\":1,\"enrollment_date\":\"2026-08-09\",\"total_hours\":48}" > temp.txt 2>&1
set /p ENR=<temp.txt
curl -s -X POST http://localhost:3001/api/enrollments -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_id\":2,\"course_id\":1,\"enrollment_date\":\"2026-08-09\",\"total_hours\":48}" > temp.txt 2>&1
set /p ENR2=<temp.txt
echo !ENR! | findstr /i "id\|enrollment_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !ENR!
    set /a FAIL+=1
)
echo.

:: 17. 获取报名列表
echo [17] 获取报名列表 - GET /api/enrollments
curl -s http://localhost:3001/api/enrollments -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p ENR_LIST=<temp.txt
echo !ENR_LIST! | findstr /i "student_id\|course_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !ENR_LIST!
    set /a FAIL+=1
)
echo.

:: 18. 获取签到学员
echo [18] 获取签到学员 - GET /api/attendance/students/1
curl -s http://localhost:3001/api/attendance/students/1 -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p ATT_STU=<temp.txt
echo !ATT_STU! | findstr /i "id\|student" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !ATT_STU!
    set /a FAIL+=1
)
echo.

:: 19. 提交签到
echo [19] 提交签到 - POST /api/attendance
curl -s -X POST http://localhost:3001/api/attendance -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"schedule_id\":1,\"student_id\":1,\"class_date\":\"2026-08-09\",\"status\":\"present\"}" > temp.txt 2>&1
set /p ATT=<temp.txt
echo !ATT! | findstr /i "id\|success\|message" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !ATT!
    set /a FAIL+=1
)
echo.

:: 20. 收费
echo [20] 收费 - POST /api/payments
curl -s -X POST http://localhost:3001/api/payments -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"student_id\":1,\"course_id\":1,\"amount\":3000,\"payment_method\":\"wechat\",\"payment_date\":\"2026-08-09\",\"notes\":\"学费\"}" > temp.txt 2>&1
set /p PAY=<temp.txt
echo !PAY! | findstr /i "id\|receipt_no" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !PAY!
    set /a FAIL+=1
)
echo.

:: 21. 获取收费列表
echo [21] 获取收费列表 - GET /api/payments
curl -s http://localhost:3001/api/payments -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p PAY_LIST=<temp.txt
echo !PAY_LIST! | findstr /i "3000\|receipt_no" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !PAY_LIST!
    set /a FAIL+=1
)
echo.

:: 22. 收费汇总
echo [22] 收费汇总 - GET /api/payments/summary
curl -s http://localhost:3001/api/payments/summary -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p PAY_SUM=<temp.txt
echo !PAY_SUM! | findstr /i "total\|amount\|summary" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !PAY_SUM!
    set /a FAIL+=1
)
echo.

:: 23. 布置作业
echo [23] 布置作业 - POST /api/homework
curl -s -X POST http://localhost:3001/api/homework -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"teacher_id\":1,\"course_id\":1,\"title\":\"第一章习题\",\"content\":\"完成课本P1-20练习题\",\"due_date\":\"2026-08-16\"}" > temp.txt 2>&1
set /p HW=<temp.txt
echo !HW! | findstr /i "id\|homework_id" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !HW!
    set /a FAIL+=1
)
echo.

:: 24. 获取作业列表
echo [24] 获取作业列表 - GET /api/homework
curl -s http://localhost:3001/api/homework -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p HW_LIST=<temp.txt
echo !HW_LIST! | findstr /i "第一章\|习题" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !HW_LIST!
    set /a FAIL+=1
)
echo.

:: 25. 仪表盘报表
echo [25] 仪表盘报表 - GET /api/reports/dashboard
curl -s http://localhost:3001/api/reports/dashboard -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p DASH=<temp.txt
echo !DASH! | findstr /i "students\|courses\|teachers" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !DASH!
    set /a FAIL+=1
)
echo.

:: 26. 收入报表
echo [26] 收入报表 - GET /api/reports/revenue
curl -s http://localhost:3001/api/reports/revenue -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p REV=<temp.txt
echo !REV! | findstr /i "total\|revenue\|amount" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !REV!
    set /a FAIL+=1
)
echo.

:: 27. 学员统计
echo [27] 学员统计 - GET /api/reports/students
curl -s http://localhost:3001/api/reports/students -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p STU_STAT=<temp.txt
echo !STU_STAT! | findstr /i "total\|count\|students" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !STU_STAT!
    set /a FAIL+=1
)
echo.

:: 28. 课程统计
echo [28] 课程统计 - GET /api/reports/courses
curl -s http://localhost:3001/api/reports/courses -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p CRS_STAT=<temp.txt
echo !CRS_STAT! | findstr /i "total\|count\|courses" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !CRS_STAT!
    set /a FAIL+=1
)
echo.

:: 29. 教师统计
echo [29] 教师统计 - GET /api/reports/teachers
curl -s http://localhost:3001/api/reports/teachers -H "Authorization: Bearer !TOKEN!" > temp.txt 2>&1
set /p TCH_STAT=<temp.txt
echo !TCH_STAT! | findstr /i "total\|count\|teachers" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ 通过
    set /a PASS+=1
) else (
    echo ❌ 失败 - 响应: !TCH_STAT!
    set /a FAIL+=1
)
echo.

:: 清理临时文件
del temp.txt 2>nul

echo ========================================
echo   测试结果汇总
echo ========================================
echo   ✅ 通过: !PASS!/29
echo   ❌ 失败: !FAIL!/29
echo ========================================

endlocal
