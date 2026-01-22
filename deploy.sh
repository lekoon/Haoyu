#!/bin/bash

# Haoyu (浩宇) - 一键部署工具 (Linux/macOS)

echo "==================================================="
echo "  Haoyu (浩宇) - 一键部署工具 (Linux/macOS)"
echo "==================================================="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[错误] 未检测到 Docker，请参考官方文档安装: https://docs.docker.com/get-docker/"
    exit 1
fi

# 2. 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "[错误] 未检测到 Docker Compose，请安装后再试。"
    exit 1
fi

# 3. 询问是否清理
read -p "是否清理旧镜像并重新构建? (y/n): " CLEAN
if [[ $CLEAN == "y" || $CLEAN == "Y" ]]; then
    echo "[状态] 正在清理旧容器和镜像..."
    docker compose down --rmi local
fi

# 4. 启动环境
echo "[状态] 正在启动 Haoyu 容器化服务..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "==================================================="
    echo "  部署成功! Haoyu 平台正在后台运行。"
    echo "==================================================="
    echo "  前端访问地址: http://localhost:80"
    echo "  后台接口地址: http://localhost:3000/api"
    echo "  数据库端口  : 5432"
    echo "==================================================="
    echo ""
    docker compose ps
else
    echo "[错误] 部署失败，请检查 Docker 运行状态。"
fi
