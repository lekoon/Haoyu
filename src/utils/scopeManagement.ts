import type { Project, ChangeRequest, ScopeCreepMetrics, Task } from '../types';

/**
 * 计算项目的范围蔓延指数
 * Scope Creep Index = (当前总工时 - 基线工时) / 基线工时 * 100
 */
export function calculateScopeCreepMetrics(
    project: Project,
    changeRequests: ChangeRequest[]
): ScopeCreepMetrics {
    // 从基线获取初始工时
    const baseline = project.baselines?.find(b => b.id === project.activeBaselineId);
    const baselineEffortHours = baseline
        ? calculateTotalEffortHours(baseline.snapshot.tasks)
        : calculateTotalEffortHours(project.tasks || []);

    // 计算当前工时
    const currentEffortHours = calculateTotalEffortHours(project.tasks || []);

    // 计算蔓延百分比
    const creepPercentage =
        baselineEffortHours > 0
            ? ((currentEffortHours - baselineEffortHours) / baselineEffortHours) * 100
            : 0;

    // 统计变更请求
    const totalChangeRequests = changeRequests.length;
    const approvedChanges = changeRequests.filter(cr => cr.status === 'approved').length;
    const rejectedChanges = changeRequests.filter(cr => cr.status === 'rejected').length;
    const pendingChanges = changeRequests.filter(cr => cr.status === 'pending').length;

    // 判断是否超过阈值
    const THRESHOLD = 30; // 30% 阈值
    const isOverThreshold = creepPercentage > THRESHOLD;
    const requiresRebaseline = isOverThreshold;

    return {
        projectId: project.id,
        projectName: project.name,
        baselineEffortHours,
        currentEffortHours,
        creepPercentage,
        totalChangeRequests,
        approvedChanges,
        rejectedChanges,
        pendingChanges,
        isOverThreshold,
        requiresRebaseline,
        calculatedAt: new Date().toISOString(),
    };
}

/**
 * 计算任务列表的总工时
 */
function calculateTotalEffortHours(tasks: Task[]): number {
    return tasks.reduce((total, task) => {
        // 假设每个任务有一个隐含的工时估算
        // 可以基于开始和结束日期计算
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const hours = days * 8; // 假设每天 8 小时
        return total + hours;
    }, 0);
}

/**
 * 验证变更请求是否会导致项目不可行
 */
export function validateChangeRequest(
    project: Project,
    changeRequest: ChangeRequest
): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查是否有足够的预算
    if (project.budget && project.actualCost) {
        const remainingBudget = project.budget - project.actualCost;
        if (changeRequest.estimatedCostIncrease > remainingBudget) {
            errors.push(
                `变更成本 (${changeRequest.estimatedCostIncrease}) 超过剩余预算 (${remainingBudget})`
            );
        } else if (changeRequest.estimatedCostIncrease > remainingBudget * 0.8) {
            warnings.push(
                `变更将消耗剩余预算的 ${Math.round((changeRequest.estimatedCostIncrease / remainingBudget) * 100)}%`
            );
        }
    }

    // 检查进度影响
    if (changeRequest.scheduleImpactDays > 0) {
        const currentEnd = new Date(project.endDate);
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + changeRequest.scheduleImpactDays);

        warnings.push(
            `项目结束日期将从 ${currentEnd.toLocaleDateString()} 延后到 ${newEnd.toLocaleDateString()}`
        );
    }

    // 检查是否缺少业务理由
    if (!changeRequest.businessJustification || changeRequest.businessJustification.length < 20) {
        errors.push('必须提供充分的业务理由（至少 20 个字符）');
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
    };
}

/**
 * 检测幽灵任务（未关联需求的任务）
 */
export function detectGhostTasks(
    project: Project,
    requirements: any[] // Requirement[]
): {
    taskId: string;
    taskName: string;
    reason: 'no_requirement_link' | 'no_deliverable' | 'duplicate' | 'obsolete';
    estimatedEffort: number;
}[] {
    const ghostTasks: any[] = [];
    const tasks = project.tasks || [];

    tasks.forEach(task => {
        // 检查是否有关联的需求
        const hasRequirement = requirements.some(req =>
            req.relatedTaskIds?.includes(task.id)
        );

        if (!hasRequirement) {
            const start = new Date(task.startDate);
            const end = new Date(task.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const estimatedEffort = days * 8;

            ghostTasks.push({
                taskId: task.id,
                taskName: task.name,
                reason: 'no_requirement_link' as const,
                estimatedEffort,
            });
        }
    });

    return ghostTasks;
}

/**
 * 生成范围蔓延警告消息
 */
export function generateScopeCreepWarning(metrics: ScopeCreepMetrics): string | null {
    if (!metrics.isOverThreshold) {
        return null;
    }

    return `⚠️ 范围蔓延警告：项目 "${metrics.projectName}" 的工时已超出基线 ${metrics.creepPercentage.toFixed(1)}%。
    
当前工时：${metrics.currentEffortHours} 小时
基线工时：${metrics.baselineEffortHours} 小时
增加工时：${metrics.currentEffortHours - metrics.baselineEffortHours} 小时

建议：
1. 审查所有变更请求（已批准：${metrics.approvedChanges}，待审批：${metrics.pendingChanges}）
2. 考虑重新设定项目基线
3. 评估是否需要增加预算或延长工期`;
}
