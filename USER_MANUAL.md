# Haoyu (浩宇) - 数字化项目管理与决策支持平台用户手册

Haoyu 是一款专为企业级项目管理、资源分配及战略决策设计的综合性平台。它集成了实时进度追踪、科学的战略评分、动态资源冲突检测以及全方位的风险控制模块。

##  快速入门

### 环境准备
*   **Node.js**: v18.0.0 或更高版本
*   **Database**: PostgreSQL 15+
*   **Docker**: (可选) 用于快速部署镜像

### 1. 一键开发初始化 (本地开发)
如果您是要进行二次开发或本地运行：
1.  **Windows**: 双击 root 目录下的 setup-dev.bat。
2.  **Linux/Mac**: 运行 chmod +x setup-dev.sh && ./setup-dev.sh。

初始化完成后，运行：
`ash
npm run dev
`
*   **前端访问**: http://localhost:4000
*   **后端接口**: http://localhost:3000/api

### 2. 一键生产部署 (Docker)
如果您仅需要在服务器运行平台：
1.  **Windows**: 运行 deploy.bat。
2.  **Linux/Mac**: 运行 ./deploy.sh。
*   **访问入口**: http://localhost:80

---

##  核心模块说明

### 1. 项目看板与详情
*   **健康度仪表盘**: 系统根据进度、成本和风险自动生成的 0-100 分实时评分。
*   **多维视图**: 任务、资源、风险及高级分析。

### 2. 任务与甘特图
*   **WBS 编排**: 支持层级化任务管理。
*   **动态拖拽**: 甘特图中直接调整工期，自动同步后端。

### 3. 风险管理
*   **5x5 矩阵**: 自动生成的风险评分矩阵图。
*   **缓解策略**: 记录并追踪风险应对措施。

---

##  技术架构
*   **前端**: React 18, Vite, React Query, Tailwind CSS.
*   **后端**: NestJS, Prisma ORM, PostgreSQL.
*   **运维**: Nx, Docker, GitHub Actions.
