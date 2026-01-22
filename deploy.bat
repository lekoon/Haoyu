@echo off
setlocal

echo ===================================================
echo   Haoyu (浩宇) - 一键部署工具 (Windows)
echo ===================================================

:: 1. 检查 Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker，请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 2. 检查 Docker Compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker Compose，请确保 Docker Desktop 已安装并运行。
    pause
    exit /b 1
)

:: 3. 询问是否清理旧环境
set /p CLEAN="是否清理旧镜像并重新构建? (y/n): "
if /i "%CLEAN%"=="y" (
    echo [状态] 正在清理旧容器和镜像...
    docker compose down --rmi local
)

:: 4. 启动环境
echo [状态] 正在启动 Haoyu 容器化服务...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [错误] 部署失败，请检查 Docker 日志。
    pause
    exit /b 1
)

echo ===================================================
echo   部署成功! Haoyu 平台正在后台运行。
echo ===================================================
echo   前端访问地址: http://localhost:80
echo   后台接口地址: http://localhost:3000/api
echo   数据库端口  : 5432
echo ===================================================
echo.
echo 按任意键查看容器状态...
pause
docker compose ps
pause
