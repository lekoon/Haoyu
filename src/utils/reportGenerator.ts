import { Project, ResourcePoolItem } from '../types';
import { format } from 'date-fns';

/**
 * Advanced report generation utilities for management reporting
 */

export interface ExecutiveReport {
    reportDate: string;
    summary: {
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        totalBudget: number;
        totalSpent: number;
        budgetUtilization: number;
        overBudgetProjects: number;
        delayedProjects: number;
    };
    projectsByStatus: Record<string, number>;
    projectsByPriority: Record<string, number>;
    topRisks: Array<{
        projectName: string;
        riskCount: number;
        criticalRisks: number;
    }>;
    resourceUtilization: Array<{
        resourceName: string;
        allocated: number;
        available: number;
        utilizationRate: number;
    }>;
    costAnalysis: {
        totalBudget: number;
        totalSpent: number;
        variance: number;
        variancePercentage: number;
        projectsOverBudget: number;
        projectsUnderBudget: number;
    };
}

/**
 * Generate executive summary report
 */
export const generateExecutiveReport = (
    projects: Project[],
    resourcePool: ResourcePoolItem[]
): ExecutiveReport => {
    const now = new Date();

    // Summary calculations
    const activeProjects = projects.filter((p) => p.status === 'active');
    const completedProjects = projects.filter((p) => p.status === 'completed');
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const overBudgetProjects = projects.filter((p) => (p.actualCost || 0) > (p.budget || 0)).length;

    // Delayed projects (end date passed but not completed)
    const delayedProjects = projects.filter(
        (p) => p.status !== 'completed' && new Date(p.endDate) < now
    ).length;

    // Projects by status
    const projectsByStatus: Record<string, number> = {};
    projects.forEach((p) => {
        projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
    });

    // Projects by priority
    const projectsByPriority: Record<string, number> = {};
    projects.forEach((p) => {
        const priority = p.priority || 'P2';
        projectsByPriority[priority] = (projectsByPriority[priority] || 0) + 1;
    });

    // Top risks
    const topRisks = projects
        .map((p) => ({
            projectName: p.name,
            riskCount: (p.risks || []).length,
            criticalRisks: (p.risks || []).filter((r) => r.priority === 'critical').length,
        }))
        .filter((r) => r.riskCount > 0)
        .sort((a, b) => b.criticalRisks - a.criticalRisks || b.riskCount - a.riskCount)
        .slice(0, 10);

    // Resource utilization
    const resourceUtilization = resourcePool.map((resource) => {
        let allocated = 0;
        projects.forEach((project) => {
            (project.resourceRequirements || []).forEach((req) => {
                if (req.resourceId === resource.id) {
                    allocated += req.count;
                }
            });
        });

        const available = resource.available || 0;
        const utilizationRate = available > 0 ? (allocated / available) * 100 : 0;

        return {
            resourceName: resource.name,
            allocated,
            available,
            utilizationRate,
        };
    });

    // Cost analysis
    const projectsUnderBudget = projects.filter((p) => (p.actualCost || 0) < (p.budget || 0)).length;
    const variance = totalBudget - totalSpent;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    return {
        reportDate: format(now, 'yyyy-MM-dd HH:mm:ss'),
        summary: {
            totalProjects: projects.length,
            activeProjects: activeProjects.length,
            completedProjects: completedProjects.length,
            totalBudget,
            totalSpent,
            budgetUtilization,
            overBudgetProjects,
            delayedProjects,
        },
        projectsByStatus,
        projectsByPriority,
        topRisks,
        resourceUtilization,
        costAnalysis: {
            totalBudget,
            totalSpent,
            variance,
            variancePercentage,
            projectsOverBudget: overBudgetProjects,
            projectsUnderBudget,
        },
    };
};

/**
 * Export executive report to PDF-ready HTML
 */
export const exportExecutiveReportHTML = (report: ExecutiveReport): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>项目组合管理执行报告</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
        .header .date { color: #666; margin-top: 10px; font-size: 14px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-title { font-size: 20px; color: #2563eb; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #2563eb; }
        .summary-card .number { font-size: 32px; font-weight: bold; color: #2563eb; }
        .summary-card .label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #2563eb; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .status-planning { background: #fef3c7; color: #92400e; }
        .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        .alert-title { font-weight: bold; color: #dc2626; margin-bottom: 5px; }
        .success { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0; }
        .success-title { font-weight: bold; color: #16a34a; margin-bottom: 5px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>项目组合管理执行报告</h1>
        <div class="date">报告生成时间: ${report.reportDate}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <div class="section-title">执行摘要</div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="number">${report.summary.totalProjects}</div>
                <div class="label">项目总数</div>
            </div>
            <div class="summary-card">
                <div class="number">${report.summary.activeProjects}</div>
                <div class="label">进行中</div>
            </div>
            <div class="summary-card">
                <div class="number">${report.summary.completedProjects}</div>
                <div class="label">已完成</div>
            </div>
            <div class="summary-card">
                <div class="number">${report.summary.budgetUtilization.toFixed(1)}%</div>
                <div class="label">预算使用率</div>
            </div>
        </div>

        ${report.summary.delayedProjects > 0
            ? `
        <div class="alert">
            <div class="alert-title">⚠️ 延期项目警告</div>
            <p>当前有 ${report.summary.delayedProjects} 个项目已超过计划完成日期但尚未完成，需要立即关注。</p>
        </div>
        `
            : ''
        }

        ${report.summary.overBudgetProjects > 0
            ? `
        <div class="alert">
            <div class="alert-title">💰 预算超支警告</div>
            <p>当前有 ${report.summary.overBudgetProjects} 个项目实际成本超出预算，建议进行成本控制。</p>
        </div>
        `
            : ''
        }
    </div>

    <!-- Cost Analysis -->
    <div class="section">
        <div class="section-title">成本分析</div>
        <table>
            <tr>
                <th>指标</th>
                <th>金额</th>
                <th>说明</th>
            </tr>
            <tr>
                <td>总预算</td>
                <td>¥${report.costAnalysis.totalBudget.toLocaleString()}</td>
                <td>所有项目预算总和</td>
            </tr>
            <tr>
                <td>实际支出</td>
                <td>¥${report.costAnalysis.totalSpent.toLocaleString()}</td>
                <td>已发生的实际成本</td>
            </tr>
            <tr>
                <td>预算差异</td>
                <td style="color: ${report.costAnalysis.variance >= 0 ? '#16a34a' : '#dc2626'}">
                    ¥${report.costAnalysis.variance.toLocaleString()}
                </td>
                <td>${report.costAnalysis.variancePercentage.toFixed(1)}% ${report.costAnalysis.variance >= 0 ? '节余' : '超支'}</td>
            </tr>
        </table>
    </div>

    <!-- Top Risks -->
    ${report.topRisks.length > 0
            ? `
    <div class="section">
        <div class="section-title">高风险项目</div>
        <table>
            <tr>
                <th>项目名称</th>
                <th>风险总数</th>
                <th>极高风险</th>
            </tr>
            ${report.topRisks
                .map(
                    (risk) => `
            <tr>
                <td>${risk.projectName}</td>
                <td>${risk.riskCount}</td>
                <td style="color: ${risk.criticalRisks > 0 ? '#dc2626' : '#666'}; font-weight: ${risk.criticalRisks > 0 ? 'bold' : 'normal'}">
                    ${risk.criticalRisks}
                </td>
            </tr>
            `
                )
                .join('')}
        </table>
    </div>
    `
            : ''
        }

    <!-- Resource Utilization -->
    <div class="section">
        <div class="section-title">资源利用率</div>
        <table>
            <tr>
                <th>资源名称</th>
                <th>已分配</th>
                <th>可用总量</th>
                <th>利用率</th>
            </tr>
            ${report.resourceUtilization
            .map(
                (res) => `
            <tr>
                <td>${res.resourceName}</td>
                <td>${res.allocated}</td>
                <td>${res.available}</td>
                <td style="color: ${res.utilizationRate > 80 ? '#dc2626' : res.utilizationRate > 60 ? '#f59e0b' : '#16a34a'}">
                    ${res.utilizationRate.toFixed(1)}%
                </td>
            </tr>
            `
            )
            .join('')}
        </table>
    </div>

    <div class="footer">
        <p>本报告由 Visorq 项目管理系统自动生成</p>
        <p>© 2025 Visorq Team. All rights reserved.</p>
    </div>
</body>
</html>
    `;
};

/**
 * Print executive report
 */
export const printExecutiveReport = (report: ExecutiveReport): void => {
    const htmlContent = exportExecutiveReportHTML(report);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

/**
 * Export report to Excel-compatible format
 */
export const exportReportToExcel = (report: ExecutiveReport): void => {
    const htmlContent = exportExecutiveReportHTML(report);
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `项目组合执行报告_${format(new Date(), 'yyyyMMdd')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
