# Haoyu (浩宇) - Enterprise Digital Project Management & Strategy Platform

Haoyu is a comprehensive digital transformation platform designed for large-scale enterprise project management, resource orchestration, and strategic decision support. It bridges the gap between tactical execution (Gantt/Tasks) and strategic alignment (Scoring/PDSG).

##  Vision
To provide a single source of truth for complex projects, enabling organizations to balance resource loads efficiently and make data-driven investment decisions through advanced scoring models.

##  Key Functional Modules

###  Project Governance & Analytics
- **Dynamic Board**: Real-time project tracking across life-cycle stages.
- **Health Dashboard**: Automated 0-100 scoring based on schedule slippage, budget vs actuals, and risk density.
- **Stage-Gate (PDSG)**: Integrated approval workflows for moving projects through critical checkpoints.

###  Advanced Task Engine (WBS/Gantt)
- **Hierarchical WBS**: Multi-level task decomposition for complex engineering projects.
- **Interactive Gantt**: Visual timeline management with drag-and-drop rescheduling and dependency tracking.
- **Sync Engine**: Real-time backend synchronization for collaborative planning.

###  Risk & Change Control
- **Risk Heatmap**: 5x5 Matrix visualization based on Probability and Impact.
- **Mitigation Tracking**: Structured records of risk owners and response strategies.
- **CR Management**: Formal Change Request (CR) workflow to manage scope, schedule, and budget deviations.

###  Strategic Resource Orchestration
- **Conflict Detection**: Automated detection of overlapping assignments for personnel and specialized equipment.
- **Strategic Scoring**: Multi-factor model to rank projects by strategic importance, ROI, and feasibility.

##  Technology Stack
- **Frontend**: React 18 (Hooks/Context), Vite, TanStack Query (React Query), Tailwind CSS, Framer Motion.
- **Backend**: NestJS (v11+), Node.js, TypeScript.
- **Data Persistence**: Prisma ORM with PostgreSQL.
- **Monorepo & Tooling**: Nx Build System, Docker, GitHub Actions (CI/CD).

##  One-Click Quick Start

### 1. Developer Setup (Node.js Required)
Perfect for local development and debugging:
- **Windows**: Run `setup-dev.bat`
- **Linux/Unix**: Run `./setup-dev.sh`
- **Start**: `npm run dev` (Access at `http://localhost:4000`)

### 2. Deployment Setup (Docker Required)
Recommended for production evaluation or rapid staging:
- **Windows**: Run `deploy.bat`
- **Linux/Unix**: Run `./deploy.sh`
- **Access**: `http://localhost:80`

##  Detailed Documentation
- [User Manual (USER_MANUAL.md)](./USER_MANUAL.md) - Detailed installation, configuration, and module guide.

##  License
Enterprise Private Project. All rights reserved.
