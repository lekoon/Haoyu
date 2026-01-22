@echo off
setlocal

echo ===================================================
echo   Haoyu (浩宇) - 开发环境一键初始化 (Windows)
echo ===================================================

:: 1. 检查 Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)

:: 2. 安装依赖
echo [状态] 正在安装 NPM 依赖 (可能需要几分钟)...
call npm install

:: 3. 准备配置文件
if not exist .env (
    echo [状态] 正在创建默认 .env 配置文件...
    copy .env.example .env
)

:: 4. 生成 Prisma 客户端
echo [状态] 正在同步数据库 Schema...
call npx prisma generate --schema ./apps/api/prisma/schema.prisma

echo ===================================================
echo   初始化完成! 
echo ===================================================
echo   提示: 启动开发服务器请运行: npm run dev
echo   提示: 前端访问地址: http://localhost:4000
echo   提示: 后台 API 地址: http://localhost:3000/api
echo ===================================================
echo.
set /p START="是否现在启动开发服务器? (y/n): "
if /i "%START%"=="y" (
    npm run dev
)
pause
