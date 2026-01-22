#!/bin/bash

# Haoyu (浩宇) - 开发环境一键初始化 (Linux/macOS)

echo "==================================================="
echo "  Haoyu (浩宇) - 开发环境一键初始化"
echo "==================================================="

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装: https://nodejs.org/"
    exit 1
fi

# 2. 安装依赖
echo "[状态] 正在安装 NPM 依赖..."
npm install

# 3. 准备配置文件
if [ ! -f .env ]; then
    echo "[状态] 正在创建默认 .env 配置文件..."
    cp .env.example .env
fi

# 4. 生成 Prisma 客户端
echo "[状态] 正在同步数据库 Schema..."
npx prisma generate --schema ./apps/api/prisma/schema.prisma

echo "==================================================="
echo "  初始化完成!"
echo "  提示: 启动开发服务器请运行: npm run dev"
echo "  前端地址: http://localhost:4000"
echo "  后台地址: http://localhost:3000/api"
echo "==================================================="
echo ""
read -p "是否现在启动开发服务器? (y/n): " START
if [[ $START == "y" || $START == "Y" ]]; then
    npm run dev
fi
