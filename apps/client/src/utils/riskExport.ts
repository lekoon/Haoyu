import type { Risk, Project } from '../types';
import { getRiskCategoryInfo, getRiskStatusInfo } from './riskManagement';
import { format } from 'date-fns';

/**
 * Export risks to CSV format
 */
export const exportRisksToCSV = (risks: Risk[], projectName: string): void => {
    const headers = [
        'ID',
        '标题',
        '类别',
        '状态',
        '优先级',
        '概率',
        '影响',
        '风险分数',
        '描述',
        '缓解策略',
        '应急计划',
        '负责人',
        '识别日期',
        '预估成本影响',
        '缓解成本',
    ];

    const rows = risks.map((risk) => {
        const categoryInfo = getRiskCategoryInfo(risk.category);
        const statusInfo = getRiskStatusInfo(risk.status);

        return [
            risk.id,
            risk.title,
            categoryInfo.label,
            statusInfo.label,
            risk.priority.toUpperCase(),
            risk.probability,
            risk.impact,
            risk.riskScore,
            `"${risk.description.replace(/"/g, '""')}"`, // Escape quotes
            `"${(risk.mitigationStrategy || '').replace(/"/g, '""')}"`,
            `"${(risk.contingencyPlan || '').replace(/"/g, '""')}"`,
            risk.ownerName || risk.owner,
            format(new Date(risk.identifiedDate), 'yyyy-MM-dd'),
            risk.estimatedCostImpact || 0,
            risk.mitigationCost || 0,
        ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}_风险清单_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export risks to Excel-compatible HTML format
 */
export const exportRisksToExcel = (risks: Risk[], projectName: string): void => {
    const categoryInfo = (cat: string) => getRiskCategoryInfo(cat as any).label;
    const statusInfo = (status: string) => getRiskStatusInfo(status as any).label;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #4472C4; color: white; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 10px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .critical { background-color: #ffebee; }
        .high { background-color: #fff3e0; }
        .medium { background-color: #fff9c4; }
        .low { background-color: #e8f5e9; }
        h1 { color: #333; font-family: Arial, sans-serif; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${projectName} - 风险清单</h1>
    <div class="meta">
        <p>导出时间: ${format(new Date(), 'yyyy年MM月dd日 HH:mm:ss')}</p>
        <p>总风险数: ${risks.length} | 活跃风险: ${risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted').length}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>标题</th>
                <th>类别</th>
                <th>状态</th>
                <th>优先级</th>
                <th>概率</th>
                <th>影响</th>
                <th>风险分数</th>
                <th>描述</th>
                <th>缓解策略</th>
                <th>负责人</th>
                <th>识别日期</th>
                <th>预估成本影响</th>
            </tr>
        </thead>
        <tbody>
            ${risks
            .map(
                (risk) => `
                <tr class="${risk.priority}">
                    <td>${risk.id}</td>
                    <td><strong>${risk.title}</strong></td>
                    <td>${categoryInfo(risk.category)}</td>
                    <td>${statusInfo(risk.status)}</td>
                    <td>${risk.priority.toUpperCase()}</td>
                    <td>${risk.probability}/5</td>
                    <td>${risk.impact}/5</td>
                    <td><strong>${risk.riskScore}</strong></td>
                    <td>${risk.description}</td>
                    <td>${risk.mitigationStrategy || '-'}</td>
                    <td>${risk.ownerName || risk.owner}</td>
                    <td>${format(new Date(risk.identifiedDate), 'yyyy-MM-dd')}</td>
                    <td>${risk.estimatedCostImpact ? `¥${risk.estimatedCostImpact.toLocaleString()}` : '-'}</td>
                </tr>
            `
            )
            .join('')}
        </tbody>
    </table>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}_风险清单_${format(new Date(), 'yyyyMMdd')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Generate PDF-ready HTML for risk report
 */
export const generateRiskReportHTML = (risks: Risk[], project: Project): string => {
    const activeRisks = risks.filter((r) => r.status !== 'resolved' && r.status !== 'accepted');
    const criticalRisks = activeRisks.filter((r) => r.priority === 'critical');
    const highRisks = activeRisks.filter((r) => r.priority === 'high');

    const categoryInfo = (cat: string) => getRiskCategoryInfo(cat as any);
    const statusInfo = (status: string) => getRiskStatusInfo(status as any);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${project.name} - 风险评估报告</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #4472C4; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #4472C4; margin: 0; font-size: 28px; }
        .header .subtitle { color: #666; margin-top: 10px; font-size: 14px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px; }
        .summary-card { background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary-card .number { font-size: 32px; font-weight: bold; color: #4472C4; }
        .summary-card .label { font-size: 12px; color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section-title { font-size: 20px; color: #4472C4; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 15px; }
        .risk-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; }
        .risk-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
        .risk-title { font-size: 18px; font-weight: bold; color: #333; }
        .risk-badges { display: flex; gap: 8px; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .badge.critical { background: #ffebee; color: #c62828; }
        .badge.high { background: #fff3e0; color: #e65100; }
        .badge.medium { background: #fff9c4; color: #f57f17; }
        .badge.low { background: #e8f5e9; color: #2e7d32; }
        .risk-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .risk-meta-item { font-size: 13px; }
        .risk-meta-item .label { color: #666; font-weight: 500; }
        .risk-meta-item .value { color: #333; font-weight: bold; margin-top: 3px; }
        .risk-description { margin-bottom: 15px; font-size: 14px; line-height: 1.8; }
        .risk-mitigation { background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; }
        .risk-mitigation .title { font-weight: bold; color: #1976d2; margin-bottom: 8px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${project.name}</h1>
        <div class="subtitle">风险评估报告</div>
        <div class="subtitle">生成时间: ${format(new Date(), 'yyyy年MM月dd日 HH:mm')}</div>
    </div>

    <div class="summary">
        <h2 style="margin-top: 0; color: #333;">执行摘要</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="number">${risks.length}</div>
                <div class="label">总风险数</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #f57c00;">${activeRisks.length}</div>
                <div class="label">活跃风险</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #d32f2f;">${criticalRisks.length}</div>
                <div class="label">极高风险</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: #388e3c;">${risks.filter((r) => r.status === 'resolved').length}</div>
                <div class="label">已解决</div>
            </div>
        </div>
    </div>

    ${criticalRisks.length > 0
            ? `
    <div class="section">
        <div class="section-title">🔴 极高风险 (Critical)</div>
        ${criticalRisks
                .map(
                    (risk) => `
        <div class="risk-card">
            <div class="risk-header">
                <div class="risk-title">${risk.title}</div>
                <div class="risk-badges">
                    <span class="badge critical">CRITICAL</span>
                    <span class="badge" style="background: #e1f5fe; color: #0277bd;">${categoryInfo(risk.category).label}</span>
                </div>
            </div>
            <div class="risk-meta">
                <div class="risk-meta-item">
                    <div class="label">概率</div>
                    <div class="value">${risk.probability}/5</div>
                </div>
                <div class="risk-meta-item">
                    <div class="label">影响</div>
                    <div class="value">${risk.impact}/5</div>
                </div>
                <div class="risk-meta-item">
                    <div class="label">风险分数</div>
                    <div class="value">${risk.riskScore}</div>
                </div>
            </div>
            <div class="risk-description">
                <strong>描述:</strong> ${risk.description}
            </div>
            ${risk.mitigationStrategy
                            ? `
            <div class="risk-mitigation">
                <div class="title">缓解策略</div>
                <div>${risk.mitigationStrategy}</div>
            </div>
            `
                            : ''
                        }
        </div>
        `
                )
                .join('')}
    </div>
    `
            : ''
        }

    ${highRisks.length > 0
            ? `
    <div class="section">
        <div class="section-title">🟠 高风险 (High)</div>
        ${highRisks
                .map(
                    (risk) => `
        <div class="risk-card">
            <div class="risk-header">
                <div class="risk-title">${risk.title}</div>
                <div class="risk-badges">
                    <span class="badge high">HIGH</span>
                    <span class="badge" style="background: #e1f5fe; color: #0277bd;">${categoryInfo(risk.category).label}</span>
                </div>
            </div>
            <div class="risk-meta">
                <div class="risk-meta-item">
                    <div class="label">概率</div>
                    <div class="value">${risk.probability}/5</div>
                </div>
                <div class="risk-meta-item">
                    <div class="label">影响</div>
                    <div class="value">${risk.impact}/5</div>
                </div>
                <div class="risk-meta-item">
                    <div class="label">风险分数</div>
                    <div class="value">${risk.riskScore}</div>
                </div>
            </div>
            <div class="risk-description">
                <strong>描述:</strong> ${risk.description}
            </div>
        </div>
        `
                )
                .join('')}
    </div>
    `
            : ''
        }

    <div class="footer">
        <p>本报告由 Haoyu 项目管理系统自动生成</p>
        <p>© 2025 Haoyu Team. All rights reserved.</p>
    </div>
</body>
</html>
    `;
};

/**
 * Print risk report (opens print dialog with formatted HTML)
 */
export const printRiskReport = (risks: Risk[], project: Project): void => {
    const htmlContent = generateRiskReportHTML(risks, project);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};
