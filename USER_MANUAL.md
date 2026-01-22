# Haoyu (浩宇) - 数字化项目管理与决策支持平台用户手册

Haoyu 是一款专为企业级项目管理、资源分配及战略决策设计的综合性平台。它集成了实时进度追踪、科学的战略评分、动态资源冲突检测以及全方位的风险控制模块。

## 🚀 快速入门

### 环境准备
*   **Node.js**: v18.0.0 或更高版本
*   **Database**: PostgreSQL 15+
*   **Docker**: (可选) 用于快速部署镜像

### 本地启动
1.  **安装依赖**:
    ```bash
    npm install
    ```
2.  **配置数据库**:
    在 `.env` 文件中配置 `DATABASE_URL`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/haoyu"
    JWT_SECRET="your-secret-key"
    ```
3.  **初始化数据库**:
    ```bash
    npx prisma migrate dev
    ```
4.  **启动后端与前端**:
    ```bash
    npm run dev
    ```
    *   **前端访问**: `http://localhost:4000`
    *   **后端接口**: `http://localhost:3000/api`

---

## 🛠 核心模块说明

### 1. 项目看板与详情 (`Project Board & Detail`)
*   **全景视图**: 提供网格化看板，按状态（规划中、进行中、已完成、暂停）分类项目。
*   **高级视图**: 支持切换“任务视图”、“资源视图”、“风险视图”等。
*   **健康度仪表盘**: 系统根据进度、成本和风险自动生成的 0-100 分实时健康度评分。

### 2. 类甘特图任务引擎 (`Interactive Gantt & WBS`)
*   **层级编排**: 支持 WBS（任务分解结构），可折叠的任务组。
*   **交互式调整**: 在甘特图中直接拖拽修改任务起止日期。
*   **依赖管理**: 视觉化展示任务间的依赖连线，后端自动计算关键路径影响。

### 3. 战略决策支持 (Strategy & Scoring)
*   **科学评分系统**: 基于战略对齐、收益潜力、技术难度等维度进行加权评分。
*   **PMO 联动**: 自动同步项目推演模型的影响，支持“沙盘推演”数据导入。

### 4. 资源冲突监控 (Resource Management)
*   **实时检测**: 在分配资源时，系统自动检测该人员/设备是否在其他项目中已有冲突。
*   **负荷分析**: 查看团队成员的周平均分配工时，防止资源超载。

### 5. 风险与变更管理 (Risk & Change Control)
*   **风险矩阵**: 自动生成基于概率和影响评分的风险热力图。
*   **变更请求 (CR)**: 记录所有范围、时间或成本的修改申请，保留完整的决策审计线。

---

## 🐳 容器化部署

Haoyu 提供生产级的 Docker 支持，通过以下方式可以实现“一键部署”：

### 1. 自动化部署脚本 (推荐)
为了让其他机器能够快速运行环境，我们封装了自动化脚本：
*   **Windows 用户**: 直接双击根目录下的 `deploy.bat` 文件。
*   **Linux/macOS 用户**: 执行 `chmod +x deploy.sh && ./deploy.sh`。

### 2. 手动启动
如果您希望手动控制容器，请运行：
```bash
docker-compose up -d --build
```

### 3. 端口映射说明
*   **前端访问入口**: `http://localhost:80` (由 Nginx 承载)
*   **API 后台**: `http://localhost:3000/api`
*   **PostgreSQL**: `localhost:5432`

---

## 🔧 技术架构

*   **前端**: React 18, Vite, React Query, Tailwind CSS, Lucide Icons, Recharts (图表库).
*   **后端**: NestJS (Node.js 框架), JWT 认证, Prisma ORM.
*   **数据库**: PostgreSQL.
*   **自动化**: NX Monorepo 管理, GitHub Actions CI/CD.

---

## 🔒 权限建议

*   **PDSG/项目经理**: 拥有项目编辑、风险创建及资源分配权限。
*   **PMO/管理员**: 拥有战略评分因子配置、沙盘推演及全平台资源分析权限。
*   **普通成员**: 仅拥有任务查看及个人工时反馈权限。
