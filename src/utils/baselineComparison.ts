import type { Project, ProjectBaseline, Task } from '../types';

export interface BaselineComparison {
    baselineId: string;
    baselineName: string;
    currentState: {
        totalTasks: number;
        completedTasks: number;
        totalEffort: number;
        actualCost: number;
        endDate: string;
    };
    baselineState: {
        totalTasks: number;
        completedTasks: number;
        totalEffort: number;
        plannedCost: number;
        endDate: string;
    };
    variances: {
        taskVariance: number;
        effortVariance: number;
        costVariance: number;
        scheduleVarianceDays: number;
    };
    performanceIndicators: {
        SPI: number; // Schedule Performance Index
        CPI: number; // Cost Performance Index
        overallHealth: 'good' | 'warning' | 'critical';
    };
}

/**
 * 计算任务总工时
 */
function calculateTotalEffort(tasks: Task[]): number {
    return tasks.reduce((total, task) => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return total + days * 8; // 假设每天8小时
    }, 0);
}

/**
 * 对比项目当前状态与基线
 */
export function compareWithBaseline(
    project: Project,
    baseline: ProjectBaseline
): BaselineComparison {
    const currentTasks = project.tasks || [];
    const baselineTasks = baseline.snapshot.tasks || [];

    // 当前状态
    const currentState = {
        totalTasks: currentTasks.length,
        completedTasks: currentTasks.filter((t) => t.status === 'completed').length,
        totalEffort: calculateTotalEffort(currentTasks),
        actualCost: project.actualCost || 0,
        endDate: project.endDate,
    };

    // 基线状态
    const baselineState = {
        totalTasks: baselineTasks.length,
        completedTasks: 0, // 基线时所有任务都未完成
        totalEffort: calculateTotalEffort(baselineTasks),
        plannedCost: baseline.snapshot.budget || 0,
        endDate: baseline.snapshot.endDate,
    };

    // 计算偏差
    const taskVariance = currentState.totalTasks - baselineState.totalTasks;
    const effortVariance = currentState.totalEffort - baselineState.totalEffort;
    const costVariance = currentState.actualCost - baselineState.plannedCost;

    const currentEndDate = new Date(currentState.endDate);
    const baselineEndDate = new Date(baselineState.endDate);
    const scheduleVarianceDays = Math.ceil(
        (currentEndDate.getTime() - baselineEndDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 计算绩效指标
    const completionRate = currentState.completedTasks / currentState.totalTasks || 0;
    const plannedCompletionRate = 0.5; // 假设应该完成50%
    const SPI = completionRate / plannedCompletionRate; // Schedule Performance Index

    const earnedValue = baselineState.plannedCost * completionRate;
    const CPI = currentState.actualCost > 0 ? earnedValue / currentState.actualCost : 1; // Cost Performance Index

    // 综合健康度
    let overallHealth: 'good' | 'warning' | 'critical' = 'good';
    if (SPI < 0.8 || CPI < 0.8 || scheduleVarianceDays > 30) {
        overallHealth = 'critical';
    } else if (SPI < 0.9 || CPI < 0.9 || scheduleVarianceDays > 14) {
        overallHealth = 'warning';
    }

    return {
        baselineId: baseline.id,
        baselineName: baseline.name,
        currentState,
        baselineState,
        variances: {
            taskVariance,
            effortVariance,
            costVariance,
            scheduleVarianceDays,
        },
        performanceIndicators: {
            SPI,
            CPI,
            overallHealth,
        },
    };
}

/**
 * 生成基线对比报告
 */
export function generateBaselineReport(comparison: BaselineComparison): string {
    const { currentState, baselineState, variances, performanceIndicators } = comparison;

    let report = `# 基线对比报告 - ${comparison.baselineName}\n\n`;

    report += `## 📊 关键指标\n\n`;
    report += `| 指标 | 基线 | 当前 | 偏差 |\n`;
    report += `|------|------|------|------|\n`;
    report += `| 任务数 | ${baselineState.totalTasks} | ${currentState.totalTasks} | ${variances.taskVariance > 0 ? '+' : ''}${variances.taskVariance} |\n`;
    report += `| 总工时 | ${baselineState.totalEffort}h | ${currentState.totalEffort}h | ${variances.effortVariance > 0 ? '+' : ''}${variances.effortVariance}h |\n`;
    report += `| 成本 | ¥${baselineState.plannedCost.toLocaleString()} | ¥${currentState.actualCost.toLocaleString()} | ${variances.costVariance > 0 ? '+' : ''}¥${variances.costVariance.toLocaleString()} |\n`;
    report += `| 结束日期 | ${baselineState.endDate} | ${currentState.endDate} | ${variances.scheduleVarianceDays > 0 ? '+' : ''}${variances.scheduleVarianceDays}天 |\n\n`;

    report += `## 📈 绩效指标\n\n`;
    report += `- **SPI (进度绩效指数)**: ${performanceIndicators.SPI.toFixed(2)}\n`;
    report += `  - ${performanceIndicators.SPI >= 1 ? '✅ 进度符合预期' : '⚠️ 进度落后于计划'}\n\n`;
    report += `- **CPI (成本绩效指数)**: ${performanceIndicators.CPI.toFixed(2)}\n`;
    report += `  - ${performanceIndicators.CPI >= 1 ? '✅ 成本控制良好' : '⚠️ 成本超支'}\n\n`;

    report += `## 🎯 综合评估\n\n`;
    if (performanceIndicators.overallHealth === 'good') {
        report += `✅ **状态良好** - 项目按计划进行，各项指标正常。\n`;
    } else if (performanceIndicators.overallHealth === 'warning') {
        report += `⚠️ **需要关注** - 部分指标偏离基线，建议采取纠正措施。\n`;
    } else {
        report += `🚨 **严重偏离** - 项目严重偏离基线，需要立即干预。\n\n`;
        report += `### 建议措施：\n`;
        report += `1. 召开项目评审会议\n`;
        report += `2. 重新评估项目范围和资源\n`;
        report += `3. 考虑重新设定基线\n`;
    }

    return report;
}

/**
 * 计算多个基线之间的趋势
 */
export function analyzeBaselineTrend(
    project: Project,
    baselines: ProjectBaseline[]
): {
    trend: 'improving' | 'stable' | 'degrading';
    metrics: {
        date: string;
        taskCount: number;
        effort: number;
        cost: number;
    }[];
} {
    const sortedBaselines = [...baselines].sort(
        (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );

    const metrics = sortedBaselines.map((baseline) => ({
        date: baseline.createdDate,
        taskCount: baseline.snapshot.tasks?.length || 0,
        effort: calculateTotalEffort(baseline.snapshot.tasks || []),
        cost: baseline.snapshot.budget || 0,
    }));

    // 添加当前状态
    metrics.push({
        date: new Date().toISOString(),
        taskCount: project.tasks?.length || 0,
        effort: calculateTotalEffort(project.tasks || []),
        cost: project.actualCost || 0,
    });

    // 简单趋势分析：比较最近两个点
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (metrics.length >= 2) {
        const recent = metrics[metrics.length - 1];
        const previous = metrics[metrics.length - 2];

        const taskGrowth = (recent.taskCount - previous.taskCount) / previous.taskCount;
        const effortGrowth = (recent.effort - previous.effort) / previous.effort;

        if (taskGrowth > 0.1 || effortGrowth > 0.15) {
            trend = 'degrading'; // 范围蔓延
        } else if (taskGrowth < -0.05 && effortGrowth < -0.05) {
            trend = 'improving'; // 优化
        }
    }

    return {
        trend,
        metrics,
    };
}
