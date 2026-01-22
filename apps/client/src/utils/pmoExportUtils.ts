import type { Project, EVMMetrics, CrossProjectDependency } from '../types';
import { calculateEVM } from './evmCalculations';
import { detectCrossProjectDependencies } from './crossProjectDependencies';

/**
 * Export EVM report as CSV
 */
export function exportEVMToCSV(project: Project): void {
    const evm = calculateEVM(project);

    const headers = [
        '项目名称',
        '截止日期',
        '计划价值(PV)',
        '挣值(EV)',
        '实际成本(AC)',
        '进度绩效指数(SPI)',
        '成本绩效指数(CPI)',
        '进度偏差(SV)',
        '成本偏差(CV)',
        '完工估算(EAC)',
        '完工尚需估算(ETC)',
        '完工偏差(VAC)',
        '完工尚需绩效指数(TCPI)'
    ];

    const row = [
        project.name,
        new Date(evm.asOfDate).toLocaleDateString('zh-CN'),
        evm.plannedValue.toFixed(2),
        evm.earnedValue.toFixed(2),
        evm.actualCost.toFixed(2),
        evm.schedulePerformanceIndex.toFixed(3),
        evm.costPerformanceIndex.toFixed(3),
        evm.scheduleVariance.toFixed(2),
        evm.costVariance.toFixed(2),
        evm.estimateAtCompletion.toFixed(2),
        evm.estimateToComplete.toFixed(2),
        evm.varianceAtCompletion.toFixed(2),
        evm.toCompletePerformanceIndex.toFixed(3)
    ];

    const csv = [headers.join(','), row.join(',')].join('\n');
    downloadCSV(csv, `EVM报告_${project.name}_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export dependency analysis as CSV
 */
export function exportDependenciesToCSV(projects: Project[]): void {
    const dependencies = detectCrossProjectDependencies(projects);

    const headers = [
        '源项目',
        '目标项目',
        '依赖类型',
        '描述',
        '关键路径',
        '状态',
        '创建日期'
    ];

    const rows = dependencies.map(dep => [
        dep.sourceProjectName,
        dep.targetProjectName,
        dep.dependencyType,
        dep.description,
        dep.criticalPath ? '是' : '否',
        dep.status === 'active' ? '活跃' : dep.status === 'resolved' ? '已解决' : '已断开',
        new Date(dep.createdDate).toLocaleDateString('zh-CN')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `跨项目依赖分析_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export EVM report as PDF (HTML-based)
 */
export function exportEVMToPDF(project: Project): void {
    const evm = calculateEVM(project);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EVM 报告 - ${project.name}</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>挣值管理 (EVM) 报告</h1>
    <div style="margin: 20px 0;">
        <p><strong>项目名称：</strong>${project.name}</p>
        <p><strong>项目经理：</strong>${project.manager || '未分配'}</p>
        <p><strong>报告日期：</strong>${new Date(evm.asOfDate).toLocaleDateString('zh-CN')}</p>
    </div>
    <h2>核心指标</h2>
    <table>
        <tr><th>指标</th><th>值</th><th>说明</th></tr>
        <tr><td>计划价值 (PV)</td><td>¥${evm.plannedValue.toLocaleString()}</td><td>按计划应该完成的工作价值</td></tr>
        <tr><td>挣值 (EV)</td><td>¥${evm.earnedValue.toLocaleString()}</td><td>实际完成的工作价值</td></tr>
        <tr><td>实际成本 (AC)</td><td>¥${evm.actualCost.toLocaleString()}</td><td>实际花费的成本</td></tr>
    </table>
    <h2>绩效指数</h2>
    <table>
        <tr><th>指标</th><th>值</th><th>状态</th></tr>
        <tr><td>进度绩效指数 (SPI)</td><td>${evm.schedulePerformanceIndex.toFixed(3)}</td><td class="${evm.schedulePerformanceIndex >= 1 ? 'positive' : 'negative'}">${evm.schedulePerformanceIndex >= 1 ? '进度超前' : '进度落后'}</td></tr>
        <tr><td>成本绩效指数 (CPI)</td><td>${evm.costPerformanceIndex.toFixed(3)}</td><td class="${evm.costPerformanceIndex >= 1 ? 'positive' : 'negative'}">${evm.costPerformanceIndex >= 1 ? '成本节约' : '成本超支'}</td></tr>
    </table>
    <div class="footer">
        <p>此报告由 Haoyu PMO 系统自动生成 · 生成时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>
    `;

    printHTML(html, `EVM报告_${project.name}`);
}

/**
 * Helper function to download CSV
 */
function downloadCSV(csv: string, filename: string): void {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Helper function to print HTML
 */
function printHTML(html: string, title: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    }
}
