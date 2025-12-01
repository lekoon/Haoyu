/**
 * 交付效率指标计算工具
 * Delivery Efficiency Metrics Calculator
 * 
 * 核心指标:
 * 1. 事务吞吐量 (Throughput) - 单位时间交付的事务数量
 * 2. 事务前置时间 (Lead Time) - P85分位值，反映85%事务的实际交付周期
 * 3. 事务颗粒度 (Granularity) - 任务平均代码当量或工作量
 * 4. 资源利用率 (Resource Utilization) - 资源使用效率
 */

import type { Project, ResourcePoolItem } from '../types';
import { parseISO, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';

export interface DeliveryMetrics {
    projectId: string;
    projectName: string;

    // 核心效率指标
    throughput: number;          // 事务吞吐量 (事务/周)
    leadTime: number;            // 前置时间 (天, P85分位值)
    granularity: number;         // 事务颗粒度 (工作量单位)
    resourceUtilization: number; // 资源利用率 (%)

    // 项目规模
    projectSize: number;         // 项目规模 (人天)

    // 状态标识
    status: 'efficient' | 'normal' | 'warning' | 'critical';

    // 详细数据
    totalTasks: number;
    completedTasks: number;
    resourceCount: number;
    durationDays: number;
}

/**
 * 计算项目的交付效率指标
 */
export const calculateDeliveryMetrics = (
    projects: Project[],
    resourcePool: ResourcePoolItem[],
    timeRange: 'week' | 'month' | 'quarter' = 'month'
): DeliveryMetrics[] => {
    return projects
        .filter(p => p.status === 'active' || p.status === 'completed')
        .map(project => {
            // 计算项目持续时间
            const startDate = project.startDate ? parseISO(project.startDate) : new Date();
            const endDate = project.endDate ? parseISO(project.endDate) : new Date();
            const durationDays = Math.max(1, differenceInDays(endDate, startDate));
            const durationWeeks = Math.max(1, differenceInWeeks(endDate, startDate));

            // 计算任务数量
            const totalTasks = project.tasks?.length || 0;
            const completedTasks = project.tasks?.filter(t => t.progress === 100).length || 0;

            // 计算事务吞吐量 (每周完成的任务数)
            const throughput = durationWeeks > 0 ? completedTasks / durationWeeks : 0;

            // 计算前置时间 (P85分位值)
            // 简化计算: 使用项目持续时间作为基准，考虑完成度
            const progress = project.tasks?.reduce((sum, t) => sum + t.progress, 0) || 0;
            const avgProgress = totalTasks > 0 ? progress / totalTasks : 0;
            const leadTime = avgProgress > 0 ? durationDays / (avgProgress / 100) : durationDays;

            // 计算事务颗粒度 (平均任务工作量)
            // 使用资源需求总量作为工作量估算
            const totalWorkload = project.resourceRequirements.reduce((sum, req) => {
                let daysEquivalent = req.duration;
                if (req.unit === 'month') daysEquivalent = req.duration * 30;
                if (req.unit === 'year') daysEquivalent = req.duration * 365;
                return sum + (req.count * daysEquivalent);
            }, 0);
            const granularity = totalTasks > 0 ? totalWorkload / totalTasks : totalWorkload;

            // 计算资源利用率
            const resourceCount = project.resourceRequirements.reduce((sum, req) => sum + req.count, 0);
            const totalCapacity = project.resourceRequirements.reduce((sum, req) => {
                const resource = resourcePool.find(r => r.id === req.resourceId);
                return sum + (resource?.totalQuantity || 0);
            }, 0);
            const resourceUtilization = totalCapacity > 0 ? (resourceCount / totalCapacity) * 100 : 0;

            // 计算项目规模 (人天)
            const projectSize = totalWorkload;

            // 确定状态
            let status: DeliveryMetrics['status'] = 'normal';
            if (resourceUtilization > 95 || leadTime > 60) {
                status = 'critical';
            } else if (resourceUtilization > 85 || leadTime > 45) {
                status = 'warning';
            } else if (throughput > 5 && resourceUtilization >= 70 && resourceUtilization <= 85) {
                status = 'efficient';
            }

            return {
                projectId: project.id,
                projectName: project.name,
                throughput,
                leadTime,
                granularity,
                resourceUtilization,
                projectSize,
                status,
                totalTasks,
                completedTasks,
                resourceCount,
                durationDays
            };
        });
};

/**
 * 计算P85分位值
 */
export const calculateP85 = (values: number[]): number => {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.85) - 1;
    return sorted[Math.max(0, index)];
};

/**
 * 检测资源瓶颈
 */
export const detectResourceBottlenecks = (
    metrics: DeliveryMetrics[]
): {
    projectId: string;
    projectName: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
}[] => {
    const bottlenecks: any[] = [];

    metrics.forEach(metric => {
        // 高资源利用率 + 低吞吐量
        if (metric.resourceUtilization > 90 && metric.throughput < 2) {
            bottlenecks.push({
                projectId: metric.projectId,
                projectName: metric.projectName,
                issue: '资源利用率过高但吞吐量低',
                severity: 'high' as const,
                recommendation: '建议优化任务分配或增加资源投入'
            });
        }

        // 前置时间过长
        if (metric.leadTime > 60) {
            bottlenecks.push({
                projectId: metric.projectId,
                projectName: metric.projectName,
                issue: `前置时间过长 (${metric.leadTime.toFixed(0)}天)`,
                severity: 'high' as const,
                recommendation: '建议分解大颗粒度任务，优化交付流程'
            });
        }

        // 任务颗粒度过大
        if (metric.granularity > 100) {
            bottlenecks.push({
                projectId: metric.projectId,
                projectName: metric.projectName,
                issue: '任务颗粒度过大',
                severity: 'medium' as const,
                recommendation: '建议将大任务拆分为更小的可交付单元'
            });
        }

        // 资源利用率过低
        if (metric.resourceUtilization < 50 && metric.throughput < 3) {
            bottlenecks.push({
                projectId: metric.projectId,
                projectName: metric.projectName,
                issue: '资源利用率低且吞吐量低',
                severity: 'medium' as const,
                recommendation: '建议重新分配资源或调整项目优先级'
            });
        }
    });

    return bottlenecks.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
    });
};

/**
 * 生成优化建议
 */
export const generateOptimizationSuggestions = (
    metrics: DeliveryMetrics[],
    resourcePool: ResourcePoolItem[]
): {
    type: 'resource' | 'process' | 'priority';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    estimatedImprovement: string;
}[] => {
    const suggestions: any[] = [];

    // 分析整体资源利用率
    const avgUtilization = metrics.reduce((sum, m) => sum + m.resourceUtilization, 0) / metrics.length;

    if (avgUtilization > 90) {
        suggestions.push({
            type: 'resource',
            title: '整体资源利用率过高',
            description: `当前平均资源利用率为 ${avgUtilization.toFixed(1)}%，建议增加资源池容量或调整项目排期`,
            impact: 'high',
            estimatedImprovement: '可提升交付效率 20-30%'
        });
    } else if (avgUtilization < 60) {
        suggestions.push({
            type: 'resource',
            title: '资源利用率偏低',
            description: `当前平均资源利用率仅为 ${avgUtilization.toFixed(1)}%，建议增加项目并行度或优化资源分配`,
            impact: 'medium',
            estimatedImprovement: '可提升资源利用率 15-25%'
        });
    }

    // 分析交付效率
    const lowThroughputProjects = metrics.filter(m => m.throughput < 2);
    if (lowThroughputProjects.length > metrics.length * 0.3) {
        suggestions.push({
            type: 'process',
            title: '多个项目吞吐量偏低',
            description: `${lowThroughputProjects.length} 个项目的吞吐量低于 2 事务/周，建议优化开发流程和任务分解`,
            impact: 'high',
            estimatedImprovement: '可缩短交付周期 25-40%'
        });
    }

    // 分析前置时间
    const highLeadTimeProjects = metrics.filter(m => m.leadTime > 45);
    if (highLeadTimeProjects.length > 0) {
        suggestions.push({
            type: 'process',
            title: '部分项目前置时间过长',
            description: `${highLeadTimeProjects.length} 个项目的前置时间超过 45 天，建议采用敏捷方法缩短反馈周期`,
            impact: 'high',
            estimatedImprovement: '可缩短前置时间 30-50%'
        });
    }

    // 优先级优化建议
    const criticalProjects = metrics.filter(m => m.status === 'critical');
    if (criticalProjects.length > 0) {
        suggestions.push({
            type: 'priority',
            title: '关键项目需要优先处理',
            description: `${criticalProjects.length} 个项目处于临界状态，建议调整优先级并分配更多资源`,
            impact: 'high',
            estimatedImprovement: '可避免项目延期风险'
        });
    }

    return suggestions.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
    });
};
