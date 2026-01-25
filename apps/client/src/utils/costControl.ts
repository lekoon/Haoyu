import type { Project, Task, EVMMetrics } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';

/**
 * 计算项目的挣值管理指标
 */
export const calculateEVM = (project: Project, tasks: Task[]): EVMMetrics => {
    const now = new Date();
    const bac = project.budget || 0;
    const ac = project.actualCost || 0;

    let pv = 0;
    let ev = 0;

    // 如果没有任务或预算，返回默认值
    if (tasks.length === 0 || bac === 0) {
        return {
            projectId: project.id,
            asOfDate: now.toISOString(),
            plannedValue: 0, pv: 0,
            earnedValue: 0, ev: 0,
            actualCost: ac, ac,
            bac,
            schedulePerformanceIndex: 1, spi: 1,
            costPerformanceIndex: 1, cpi: 1,
            scheduleVariance: 0, sv: 0,
            costVariance: 0, cv: 0,
            estimateAtCompletion: bac, eac: bac,
            estimateToComplete: 0, etc: 0,
            varianceAtCompletion: 0, vac: 0,
            toCompletePerformanceIndex: 1, tcpi: 1,
            status: { schedule: 'on_track', cost: 'on_track' }
        };
    }

    // 计算 PV 和 EV
    const totalDuration = tasks.reduce((sum, t) => {
        const start = parseISO(t.startDate);
        const end = parseISO(t.endDate);
        return sum + Math.max(1, differenceInDays(end, start));
    }, 0);

    const costPerDay = totalDuration > 0 ? bac / totalDuration : 0;

    tasks.forEach(task => {
        const start = parseISO(task.startDate);
        const end = parseISO(task.endDate);
        const duration = Math.max(1, differenceInDays(end, start));
        const taskBudget = duration * costPerDay;

        // 计算 PV: 到目前为止应该完成的工作量价值
        if (now >= start) {
            const daysElapsed = Math.min(duration, Math.max(0, differenceInDays(now, start)));
            const plannedPercent = daysElapsed / duration;
            pv += taskBudget * plannedPercent;
        }

        // 计算 EV: 实际完成的工作量价值
        const progress = task.progress || 0;
        ev += taskBudget * (progress / 100);
    });

    // 计算偏差
    const sv = ev - pv;
    const cv = ev - ac;

    // 计算指数 (避免除以零)
    const spi = pv > 0 ? ev / pv : 1;
    const cpi = ac > 0 ? ev / ac : 1;

    // 预测未来
    const eac = cpi > 0.1 ? ac + (bac - ev) / cpi : ac + (bac - ev);
    const etc = eac - ac;
    const vac = bac - eac;

    // 确定状态
    const scheduleStatus = spi >= 1 ? 'ahead' : spi >= 0.9 ? 'on_track' : 'behind';
    const costStatus = cpi >= 1 ? 'under_budget' : cpi >= 0.9 ? 'on_track' : 'over_budget';

    return {
        projectId: project.id,
        asOfDate: now.toISOString(),
        plannedValue: pv, pv,
        earnedValue: ev, ev,
        actualCost: ac, ac,
        bac,
        schedulePerformanceIndex: spi, spi,
        costPerformanceIndex: cpi, cpi,
        scheduleVariance: sv, sv,
        costVariance: cv, cv,
        estimateAtCompletion: eac, eac,
        estimateToComplete: etc, etc,
        varianceAtCompletion: vac, vac,
        toCompletePerformanceIndex: 1, tcpi: 1, // simplified
        status: {
            schedule: scheduleStatus,
            cost: costStatus
        }
    };
};

/**
 * 生成成本预测趋势数据（用于图表）
 */
export const generateCostTrend = (metrics: EVMMetrics, months: number = 6) => {
    const data = [];
    const today = new Date();

    // 过去 3 个月的数据（模拟）
    for (let i = 3; i > 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const factor = 1 - (i * 0.1); // 模拟增长
        data.push({
            date: format(date, 'yyyy-MM'),
            ac: metrics.ac * factor,
            ev: metrics.ev * factor,
            pv: metrics.pv * factor,
            type: 'history'
        });
    }

    // 当前点
    data.push({
        date: format(today, 'yyyy-MM'),
        ac: metrics.ac,
        ev: metrics.ev,
        pv: metrics.pv,
        type: 'current'
    });

    // 未来预测（基于 EAC 线性推演）
    const remainingMonths = months;
    const monthlyBurnRate = metrics.etc / remainingMonths;

    for (let i = 1; i <= remainingMonths; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        data.push({
            date: format(date, 'yyyy-MM'),
            ac: metrics.ac + (monthlyBurnRate * i), // 预测的 AC 走向 EAC
            bac: metrics.bac, // 预算基准线
            type: 'forecast'
        });
    }

    return data;
};
